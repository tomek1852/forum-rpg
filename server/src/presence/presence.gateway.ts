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
import { AccountStatus, PresenceStatus } from "@prisma/client";
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

type PresenceEntry = {
  status: PresenceStatus;
  awayTimer: NodeJS.Timeout | null;
  offlineTimer: NodeJS.Timeout | null;
  sockets: Set<AuthenticatedSocket>;
};

const AWAY_MS = 60_000;
const OFFLINE_MS = 5 * 60_000;

@Injectable()
@WebSocketGateway({
  namespace: "presence-realtime",
  cors: {
    origin: true,
    credentials: true,
  },
})
export class PresenceGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(PresenceGateway.name);

  @WebSocketServer()
  private server!: Server;

  private readonly presenceMap = new Map<string, PresenceEntry>();
  private readonly socketUserMap = new Map<string, string>();

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

      this.socketUserMap.set(client.id, user.id);
      await this.setOnline(user.id, client);
    } catch (error) {
      this.logger.warn(`Presence auth rejected: ${this.getErrorMessage(error)}`);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const userId = this.socketUserMap.get(client.id);

    if (!userId) {
      return;
    }

    this.socketUserMap.delete(client.id);

    const entry = this.presenceMap.get(userId);

    if (!entry) {
      return;
    }

    entry.sockets.delete(client);

    if (entry.sockets.size === 0) {
      this.clearTimers(entry);
      await this.persistAndBroadcast(userId, PresenceStatus.OFFLINE);
      this.presenceMap.delete(userId);
    }
  }

  @SubscribeMessage("presence:heartbeat")
  async handleHeartbeat(@ConnectedSocket() client: AuthenticatedSocket) {
    const userId = client.data.user?.userId;

    if (!userId) {
      return;
    }

    const entry = this.presenceMap.get(userId);

    if (!entry) {
      return;
    }

    const wasAway = entry.status === PresenceStatus.AWAY;

    this.resetTimers(userId, entry);

    if (wasAway) {
      await this.persistAndBroadcast(userId, PresenceStatus.ONLINE);
    }
  }

  @SubscribeMessage("presence:watch")
  async watchUser(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { userId?: string },
  ) {
    const watchedUserId = body?.userId?.trim();

    if (!watchedUserId) {
      throw new WsException("Brak userId.");
    }

    await client.join(this.getWatcherRoom(watchedUserId));

    const entry = this.presenceMap.get(watchedUserId);
    const status = entry?.status ?? PresenceStatus.OFFLINE;

    return { userId: watchedUserId, status };
  }

  @SubscribeMessage("presence:unwatch")
  async unwatchUser(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { userId?: string },
  ) {
    const watchedUserId = body?.userId?.trim();

    if (!watchedUserId) {
      return { ok: false };
    }

    await client.leave(this.getWatcherRoom(watchedUserId));

    return { ok: true };
  }

  private async setOnline(userId: string, socket: AuthenticatedSocket) {
    const existing = this.presenceMap.get(userId);

    if (existing) {
      existing.sockets.add(socket);
      this.clearTimers(existing);
      this.resetTimers(userId, existing);

      if (existing.status !== PresenceStatus.ONLINE) {
        await this.persistAndBroadcast(userId, PresenceStatus.ONLINE);
      }
    } else {
      const entry: PresenceEntry = {
        status: PresenceStatus.ONLINE,
        awayTimer: null,
        offlineTimer: null,
        sockets: new Set([socket]),
      };

      this.presenceMap.set(userId, entry);
      this.resetTimers(userId, entry);
      await this.persistAndBroadcast(userId, PresenceStatus.ONLINE);
    }
  }

  private resetTimers(userId: string, entry: PresenceEntry) {
    this.clearTimers(entry);

    entry.awayTimer = setTimeout(() => {
      void this.setAway(userId);
    }, AWAY_MS);

    entry.offlineTimer = setTimeout(() => {
      void this.setOfflineByTimeout(userId);
    }, OFFLINE_MS);
  }

  private async setAway(userId: string) {
    const entry = this.presenceMap.get(userId);

    if (!entry || entry.sockets.size === 0) {
      return;
    }

    if (entry.status !== PresenceStatus.AWAY) {
      await this.persistAndBroadcast(userId, PresenceStatus.AWAY);
    }
  }

  private async setOfflineByTimeout(userId: string) {
    const entry = this.presenceMap.get(userId);

    if (!entry) {
      return;
    }

    this.clearTimers(entry);

    for (const socket of entry.sockets) {
      socket.disconnect(true);
    }

    await this.persistAndBroadcast(userId, PresenceStatus.OFFLINE);
    this.presenceMap.delete(userId);
  }

  private clearTimers(entry: PresenceEntry) {
    if (entry.awayTimer) {
      clearTimeout(entry.awayTimer);
      entry.awayTimer = null;
    }

    if (entry.offlineTimer) {
      clearTimeout(entry.offlineTimer);
      entry.offlineTimer = null;
    }
  }

  private async persistAndBroadcast(userId: string, status: PresenceStatus) {
    const entry = this.presenceMap.get(userId);

    if (entry) {
      entry.status = status;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        presenceStatus: status,
        lastSeenAt: new Date(),
      },
    });

    this.server
      .to(this.getWatcherRoom(userId))
      .emit("presence:changed", { userId, status });
  }

  private getWatcherRoom(userId: string) {
    return `watching:${userId}`;
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

  private getErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return "unknown";
  }
}
