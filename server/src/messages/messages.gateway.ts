import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from "@nestjs/websockets";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Server, Socket } from "socket.io";
import { AccountStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { AccessTokenPayload } from "../auth/auth.types";

type AuthenticatedSocket = Socket & {
  data: {
    user?: {
      userId: string;
      email: string;
      role: string;
    };
  };
};

@Injectable()
@WebSocketGateway({
  namespace: "messages-realtime",
  cors: {
    origin: true,
    credentials: true,
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(MessagesGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractAccessToken(client);
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: this.configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          status: true,
          emailVerified: true,
        },
      });

      if (
        !user ||
        !user.isActive ||
        !user.emailVerified ||
        user.status !== AccountStatus.ACTIVE
      ) {
        throw new WsException("Brak dostepu do realtime.");
      }

      client.data.user = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      await client.join(this.getUserRoom(user.id));
    } catch (error) {
      this.logger.warn(`Socket auth rejected: ${this.getErrorMessage(error)}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: AuthenticatedSocket) {}

  @SubscribeMessage("messages:join-conversation")
  async joinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { conversationId?: string },
  ) {
    const userId = client.data.user?.userId;
    const conversationId = body?.conversationId?.trim();

    if (!userId || !conversationId) {
      throw new WsException("Nie mozna dolaczyc do tej rozmowy.");
    }

    await this.assertConversationMembership(userId, conversationId);
    await client.join(this.getConversationRoom(conversationId));

    return {
      ok: true,
      conversationId,
    };
  }

  @SubscribeMessage("messages:leave-conversation")
  async leaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { conversationId?: string },
  ) {
    const conversationId = body?.conversationId?.trim();

    if (!conversationId) {
      return {
        ok: false,
      };
    }

    await client.leave(this.getConversationRoom(conversationId));

    return {
      ok: true,
      conversationId,
    };
  }

  emitConversationUpserted(conversationId: string, participantIds: string[]) {
    const payload = { conversationId };

    for (const participantId of participantIds) {
      this.server
        .to(this.getUserRoom(participantId))
        .emit("messages:conversation-upserted", payload);
    }
  }

  emitMessageCreated(
    payload: {
      conversationId: string;
      message: {
        id: string;
        content: string;
        createdAt: Date;
        readAt: Date | null;
        senderId: string;
        sender: {
          id: string;
          username: string;
          displayName: string | null;
          avatarUrl: string | null;
          role: string;
        };
      };
    },
    participantIds: string[],
  ) {
    this.server
      .to(this.getConversationRoom(payload.conversationId))
      .emit("messages:message-created", payload);

    for (const participantId of participantIds) {
      this.server
        .to(this.getUserRoom(participantId))
        .emit("messages:conversation-upserted", {
          conversationId: payload.conversationId,
        });
    }
  }

  emitConversationRead(
    conversationId: string,
    participantIds: string[],
    readByUserId: string,
  ) {
    const payload = {
      conversationId,
      readByUserId,
    };

    this.server
      .to(this.getConversationRoom(conversationId))
      .emit("messages:conversation-read", payload);

    for (const participantId of participantIds) {
      this.server
        .to(this.getUserRoom(participantId))
        .emit("messages:conversation-upserted", { conversationId });
    }
  }

  private async assertConversationMembership(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ userOneId: userId }, { userTwoId: userId }],
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      throw new WsException("Nie masz dostepu do tej rozmowy.");
    }
  }

  private extractAccessToken(client: AuthenticatedSocket) {
    const authToken = client.handshake.auth?.token;

    if (typeof authToken === "string" && authToken.trim()) {
      return authToken.trim();
    }

    const authorizationHeader = client.handshake.headers.authorization;

    if (
      typeof authorizationHeader === "string" &&
      authorizationHeader.startsWith("Bearer ")
    ) {
      return authorizationHeader.slice("Bearer ".length).trim();
    }

    throw new WsException("Brak tokenu dostepu.");
  }

  private getUserRoom(userId: string) {
    return `user:${userId}`;
  }

  private getConversationRoom(conversationId: string) {
    return `conversation:${conversationId}`;
  }

  private getErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return "unknown";
  }
}
