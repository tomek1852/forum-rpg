import { BadRequestException, NotFoundException } from "@nestjs/common";
import { MessagesService } from "./messages.service";

describe("MessagesService", () => {
  const messagesRealtimeService = {
    emitConversationUpserted: jest.fn(),
    emitMessageCreated: jest.fn(),
    emitConversationRead: jest.fn(),
  };
  const tx = {
    privateMessage: {
      create: jest.fn(),
    },
    conversation: {
      update: jest.fn(),
    },
  };

  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
    conversation: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    privateMessage: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: MessagesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MessagesService(
      prisma as never,
      messagesRealtimeService as never,
    );
  });

  it("creates a new conversation and reuses an existing one", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-2",
      username: "gracz2",
      displayName: "Gracz 2",
      avatarUrl: null,
      role: "PLAYER",
    });
    prisma.conversation.findUnique.mockResolvedValueOnce(null);
    prisma.conversation.create.mockResolvedValueOnce({
      id: "conversation-1",
      createdAt: new Date("2026-05-10T15:00:00.000Z"),
      updatedAt: new Date("2026-05-10T15:00:00.000Z"),
      lastMessageAt: new Date("2026-05-10T15:00:00.000Z"),
      userOneId: "user-1",
      userTwoId: "user-2",
      userOne: {
        id: "user-1",
        username: "gracz1",
        displayName: null,
        avatarUrl: null,
        role: "PLAYER",
      },
      userTwo: {
        id: "user-2",
        username: "gracz2",
        displayName: "Gracz 2",
        avatarUrl: null,
        role: "PLAYER",
      },
      messages: [],
      _count: {
        messages: 0,
      },
    });
    prisma.conversation.findUnique.mockResolvedValueOnce({
      id: "conversation-1",
      createdAt: new Date("2026-05-10T15:00:00.000Z"),
      updatedAt: new Date("2026-05-10T15:10:00.000Z"),
      lastMessageAt: new Date("2026-05-10T15:10:00.000Z"),
      userOneId: "user-1",
      userTwoId: "user-2",
      userOne: {
        id: "user-1",
        username: "gracz1",
        displayName: null,
        avatarUrl: null,
        role: "PLAYER",
      },
      userTwo: {
        id: "user-2",
        username: "gracz2",
        displayName: "Gracz 2",
        avatarUrl: null,
        role: "PLAYER",
      },
      messages: [
        {
          id: "message-1",
          content: "Hej",
          createdAt: new Date("2026-05-10T15:10:00.000Z"),
          readAt: null,
          senderId: "user-2",
          sender: {
            id: "user-2",
            username: "gracz2",
            displayName: "Gracz 2",
            avatarUrl: null,
            role: "PLAYER",
          },
        },
      ],
      _count: {
        messages: 1,
      },
    });

    const created = await service.createConversation("user-1", {
      participantId: "user-2",
    });
    const reused = await service.createConversation("user-1", {
      participantId: "user-2",
    });

    expect(created.conversation.id).toBe("conversation-1");
    expect(reused.conversation.lastMessage?.id).toBe("message-1");
    expect(prisma.conversation.create).toHaveBeenCalledTimes(1);
    expect(messagesRealtimeService.emitConversationUpserted).toHaveBeenCalledWith(
      "conversation-1",
      ["user-1", "user-2"],
    );
  });

  it("saves a private message and updates conversation activity", async () => {
    prisma.conversation.findFirst.mockResolvedValueOnce({
      id: "conversation-1",
      userOneId: "user-1",
      userTwoId: "user-2",
    });
    prisma.$transaction.mockImplementationOnce(
      async (callback: (transaction: typeof tx) => Promise<unknown>) => {
        tx.privateMessage.create.mockResolvedValueOnce({
          id: "message-1",
          content: "Czesc!",
          createdAt: new Date("2026-05-10T15:30:00.000Z"),
          readAt: null,
          senderId: "user-1",
          sender: {
            id: "user-1",
            username: "gracz1",
            displayName: null,
            avatarUrl: null,
            role: "PLAYER",
          },
        });
        tx.conversation.update.mockResolvedValueOnce({ id: "conversation-1" });

        return callback(tx);
      },
    );

    const result = await service.sendMessage("user-1", "conversation-1", {
      content: "  Czesc!  ",
    });

    expect(tx.privateMessage.create).toHaveBeenCalledWith({
      data: {
        conversationId: "conversation-1",
        senderId: "user-1",
        content: "Czesc!",
      },
      select: expect.any(Object),
    });
    expect(tx.conversation.update).toHaveBeenCalledWith({
      where: {
        id: "conversation-1",
      },
      data: {
        lastMessageAt: new Date("2026-05-10T15:30:00.000Z"),
      },
    });
    expect(result.message.content).toBe("Czesc!");
    expect(messagesRealtimeService.emitMessageCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: "conversation-1",
        message: expect.objectContaining({
          id: "message-1",
        }),
      }),
      ["user-1", "user-2"],
    );
  });

  it("lists only my conversations with unread counts", async () => {
    prisma.conversation.findMany.mockResolvedValueOnce([
      {
        id: "conversation-1",
        createdAt: new Date("2026-05-10T14:00:00.000Z"),
        updatedAt: new Date("2026-05-10T14:05:00.000Z"),
        lastMessageAt: new Date("2026-05-10T14:05:00.000Z"),
        userOneId: "user-1",
        userTwoId: "user-2",
        userOne: {
          id: "user-1",
          username: "gracz1",
          displayName: null,
          avatarUrl: null,
          role: "PLAYER",
        },
        userTwo: {
          id: "user-2",
          username: "gracz2",
          displayName: "Gracz 2",
          avatarUrl: null,
          role: "PLAYER",
        },
        messages: [
          {
            id: "message-1",
            content: "Masz chwile?",
            createdAt: new Date("2026-05-10T14:05:00.000Z"),
            readAt: null,
            senderId: "user-2",
            sender: {
              id: "user-2",
              username: "gracz2",
              displayName: "Gracz 2",
              avatarUrl: null,
              role: "PLAYER",
            },
          },
        ],
        _count: {
          messages: 1,
        },
      },
    ]);

    const result = await service.listMine("user-1");

    expect(result.conversations).toHaveLength(1);
    expect(result.conversations[0]?.otherParticipant.id).toBe("user-2");
    expect(result.conversations[0]?.unreadCount).toBe(1);
  });

  it("marks incoming messages as read", async () => {
    prisma.conversation.findFirst.mockResolvedValueOnce({
      id: "conversation-1",
      userOneId: "user-1",
      userTwoId: "user-2",
    });
    prisma.privateMessage.updateMany.mockResolvedValueOnce({ count: 2 });

    const result = await service.markConversationAsRead("user-1", "conversation-1");

    expect(prisma.privateMessage.updateMany).toHaveBeenCalledWith({
      where: {
        conversationId: "conversation-1",
        senderId: {
          not: "user-1",
        },
        readAt: null,
      },
      data: {
        readAt: expect.any(Date),
      },
    });
    expect(result.updatedCount).toBe(2);
    expect(messagesRealtimeService.emitConversationRead).toHaveBeenCalledWith(
      "conversation-1",
      ["user-1", "user-2"],
      "user-1",
    );
  });

  it("rejects empty messages and missing conversations", async () => {
    prisma.conversation.findFirst.mockResolvedValueOnce({ id: "conversation-1" });

    await expect(
      service.sendMessage("user-1", "conversation-1", {
        content: "   ",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    prisma.conversation.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.getConversationMessages("user-1", "missing"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
