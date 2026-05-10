import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { AccountStatus, type Notification } from "@prisma/client";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import type { AccessTokenPayload } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";

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
  namespace: "notifications-realtime",
  cors: {
    origin: true,
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);

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

  emitNotificationCreated(
    userId: string,
    payload: {
      notification: Notification;
      unreadCount: number;
    },
  ) {
    this.server.to(this.getUserRoom(userId)).emit("notification.created", payload);
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

  private getErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return "unknown";
  }
}
