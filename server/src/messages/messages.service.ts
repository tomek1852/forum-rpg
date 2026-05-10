import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { MessagesRealtimeService } from "./messages-realtime.service";
import { SendPrivateMessageDto } from "./dto/send-private-message.dto";

const participantSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  role: true,
} as const;

const messageSelect = {
  id: true,
  content: true,
  createdAt: true,
  readAt: true,
  senderId: true,
  sender: {
    select: participantSelect,
  },
} as const;

type MessageParticipant = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
};

type MessageRecord = {
  id: string;
  content: string;
  createdAt: Date;
  readAt: Date | null;
  senderId: string;
  sender: MessageParticipant;
};

type ConversationParticipantRecord = {
  userOneId: string;
  userTwoId: string;
  userOne: MessageParticipant;
  userTwo: MessageParticipant;
};

type ConversationSummaryRecord = ConversationParticipantRecord & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  messages: MessageRecord[];
  _count: {
    messages: number;
  };
};

@Injectable()
export class MessagesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MessagesRealtimeService)
    private readonly messagesRealtimeService: MessagesRealtimeService,
  ) {}

  async createConversation(userId: string, dto: CreateConversationDto) {
    const participantId = dto.participantId.trim();

    if (participantId === userId) {
      throw new BadRequestException("Nie mozna zalozyc rozmowy z samym soba.");
    }

    const participant = await this.prisma.user.findUnique({
      where: { id: participantId },
      select: participantSelect,
    });

    if (!participant) {
      throw new NotFoundException("Nie znaleziono odbiorcy rozmowy.");
    }

    const [userOneId, userTwoId] = this.sortParticipantIds(userId, participantId);

    const existingConversation = await this.prisma.conversation.findUnique({
      where: {
        userOneId_userTwoId: {
          userOneId,
          userTwoId,
        },
      },
      include: {
        userOne: {
          select: participantSelect,
        },
        userTwo: {
          select: participantSelect,
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
          select: messageSelect,
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: {
                  not: userId,
                },
                readAt: null,
              },
            },
          },
        },
      },
    });

    if (existingConversation) {
      return {
        conversation: this.toConversationSummary(existingConversation, userId),
      };
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        userOneId,
        userTwoId,
      },
      include: {
        userOne: {
          select: participantSelect,
        },
        userTwo: {
          select: participantSelect,
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
          select: messageSelect,
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: {
                  not: userId,
                },
                readAt: null,
              },
            },
          },
        },
      },
    });

    this.messagesRealtimeService.emitConversationUpserted(conversation.id, [
      conversation.userOneId,
      conversation.userTwoId,
    ]);

    return {
      conversation: this.toConversationSummary(conversation, userId),
    };
  }

  async listMine(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ userOneId: userId }, { userTwoId: userId }],
      },
      orderBy: {
        lastMessageAt: "desc",
      },
      include: {
        userOne: {
          select: participantSelect,
        },
        userTwo: {
          select: participantSelect,
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
          select: messageSelect,
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: {
                  not: userId,
                },
                readAt: null,
              },
            },
          },
        },
      },
    });

    return {
      conversations: conversations.map((conversation) =>
        this.toConversationSummary(conversation, userId),
      ),
    };
  }

  async getConversationMessages(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ userOneId: userId }, { userTwoId: userId }],
      },
      include: {
        userOne: {
          select: participantSelect,
        },
        userTwo: {
          select: participantSelect,
        },
        messages: {
          orderBy: {
            createdAt: "asc",
          },
          select: messageSelect,
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException("Nie znaleziono tej rozmowy.");
    }

    const unreadCount = conversation.messages.filter(
      (message) => message.senderId !== userId && !message.readAt,
    ).length;
    const latestMessage = conversation.messages.at(-1) ?? null;

    return {
      conversation: {
        id: conversation.id,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        lastMessageAt: conversation.lastMessageAt,
        otherParticipant: this.getOtherParticipant(conversation, userId),
        unreadCount,
        lastMessage: latestMessage ? this.toMessage(latestMessage) : null,
      },
      messages: conversation.messages.map((message) => this.toMessage(message)),
    };
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    dto: SendPrivateMessageDto,
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ userOneId: userId }, { userTwoId: userId }],
      },
      select: {
        id: true,
        userOneId: true,
        userTwoId: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException("Nie znaleziono tej rozmowy.");
    }

    const content = dto.content.trim();

    if (!content) {
      throw new BadRequestException("Wiadomosc nie moze byc pusta.");
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const createdMessage = await tx.privateMessage.create({
        data: {
          conversationId,
          senderId: userId,
          content,
        },
        select: messageSelect,
      });

      await tx.conversation.update({
        where: {
          id: conversationId,
        },
        data: {
          lastMessageAt: createdMessage.createdAt,
        },
      });

      return createdMessage;
    });

    this.messagesRealtimeService.emitMessageCreated(
      {
        conversationId,
        message,
      },
      [conversation.userOneId, conversation.userTwoId],
    );

    return {
      message: this.toMessage(message),
    };
  }

  async markConversationAsRead(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ userOneId: userId }, { userTwoId: userId }],
      },
      select: {
        id: true,
        userOneId: true,
        userTwoId: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException("Nie znaleziono tej rozmowy.");
    }

    const result = await this.prisma.privateMessage.updateMany({
      where: {
        conversationId,
        senderId: {
          not: userId,
        },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    if (result.count > 0) {
      this.messagesRealtimeService.emitConversationRead(
        conversationId,
        [conversation.userOneId, conversation.userTwoId],
        userId,
      );
    }

    return {
      message: "Oznaczono wiadomosci jako przeczytane.",
      updatedCount: result.count,
    };
  }

  private getOtherParticipant(
    conversation: ConversationParticipantRecord,
    userId: string,
  ) {
    if (conversation.userOneId === userId) {
      return conversation.userTwo;
    }

    if (conversation.userTwoId === userId) {
      return conversation.userOne;
    }

    throw new ForbiddenException("Nie masz dostepu do tej rozmowy.");
  }

  private toConversationSummary(
    conversation: ConversationSummaryRecord,
    userId: string,
  ) {
    const latestMessage = conversation.messages[0] ?? null;

    return {
      id: conversation.id,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      lastMessageAt: conversation.lastMessageAt,
      otherParticipant: this.getOtherParticipant(conversation, userId),
      unreadCount: conversation._count.messages,
      lastMessage: latestMessage ? this.toMessage(latestMessage) : null,
    };
  }

  private toMessage(message: MessageRecord) {
    return {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      readAt: message.readAt,
      senderId: message.senderId,
      sender: message.sender,
    };
  }

  private sortParticipantIds(firstId: string, secondId: string) {
    return [firstId, secondId].sort((left, right) => left.localeCompare(right)) as [
      string,
      string,
    ];
  }
}
