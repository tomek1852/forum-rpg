import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ActivityLogService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async log(
    actorId: string,
    action: string,
    targetType?: string,
    targetId?: string,
    meta?: Record<string, unknown>,
  ) {
    await this.prisma.activityLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId,
        meta: meta as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async list(params: {
    cursor?: string;
    limit?: number;
    actorId?: string;
    action?: string;
    targetType?: string;
    from?: string;
    to?: string;
  }) {
    const limit = Math.min(params.limit ?? 20, 100);

    const entries = await this.prisma.activityLog.findMany({
      where: {
        ...(params.actorId ? { actorId: params.actorId } : {}),
        ...(params.action ? { action: params.action } : {}),
        ...(params.targetType ? { targetType: params.targetType } : {}),
        ...(params.from || params.to
          ? {
              createdAt: {
                ...(params.from ? { gte: new Date(params.from) } : {}),
                ...(params.to ? { lte: new Date(params.to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      include: {
        actor: {
          select: { id: true, username: true, displayName: true },
        },
      },
    });

    const hasMore = entries.length > limit;
    const page = hasMore ? entries.slice(0, limit) : entries;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    return { entries: page, nextCursor };
  }
}
