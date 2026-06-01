import { Inject, Injectable } from "@nestjs/common";
import { AccountStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export interface ListUsersParams {
  search?: string;
  role?: UserRole;
  status?: AccountStatus;
  sortBy?: "createdAt" | "lastLogin" | "username";
  page?: number;
  limit?: number;
}

@Injectable()
export class AdminService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listUsers(params: ListUsersParams) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(params.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const orderBy = (() => {
      switch (params.sortBy) {
        case "lastLogin":
          return { lastSeenAt: "desc" as const };
        case "username":
          return { username: "asc" as const };
        default:
          return { createdAt: "desc" as const };
      }
    })();

    const where = {
      ...(params.role ? { role: params.role } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { username: { contains: params.search, mode: "insensitive" as const } },
              { email: { contains: params.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          role: true,
          status: true,
          emailVerified: true,
          presenceStatus: true,
          lastSeenAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  async getUserActivity(userId: string) {
    const entries = await this.prisma.activityLog.findMany({
      where: { actorId: userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        actor: { select: { id: true, username: true, displayName: true } },
      },
    });

    return { entries };
  }

  async getStats() {
    const [
      usersByStatusRaw,
      usersByRoleRaw,
      reportsByStatusRaw,
      characterCount,
      activeConversationCount,
    ] = await Promise.all([
      this.prisma.user.groupBy({ by: ["status"], _count: { _all: true } }),
      this.prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
      this.prisma.moderationReport.groupBy({ by: ["status"], _count: { _all: true } }),
      this.prisma.character.count(),
      this.prisma.conversation.count(),
    ]);

    const usersByStatus = Object.fromEntries(
      usersByStatusRaw.map((r) => [r.status, r._count._all]),
    ) as Record<AccountStatus, number>;

    const usersByRole = Object.fromEntries(
      usersByRoleRaw.map((r) => [r.role, r._count._all]),
    ) as Record<UserRole, number>;

    const reportsByStatus = Object.fromEntries(
      reportsByStatusRaw.map((r) => [r.status, r._count._all]),
    ) as Record<string, number>;

    return {
      usersByStatus,
      usersByRole,
      reportsByStatus,
      characterCount,
      activeConversationCount,
    };
  }
}
