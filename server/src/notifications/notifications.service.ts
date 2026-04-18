import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type NotificationCreateInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
};

@Injectable()
export class NotificationsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listMine(userId: string) {
    const [notifications, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ]);

    return {
      notifications,
      unreadCount,
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException("Nie znaleziono powiadomienia.");
    }

    const unreadCount = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return {
      message: "Powiadomienie oznaczono jako przeczytane.",
      unreadCount,
    };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      message: "Oznaczono wszystkie powiadomienia jako przeczytane.",
      unreadCount: 0,
    };
  }

  async createForUsers(entries: NotificationCreateInput[]) {
    const deduplicated = new Map<string, NotificationCreateInput>();

    for (const entry of entries) {
      if (!entry.userId) {
        continue;
      }

      const key = `${entry.userId}:${entry.type}:${entry.link ?? ""}:${entry.title}`;
      deduplicated.set(key, entry);
    }

    const values = [...deduplicated.values()];

    if (values.length === 0) {
      return;
    }

    await this.prisma.notification.createMany({
      data: values.map((entry) => ({
        userId: entry.userId,
        type: entry.type,
        title: entry.title,
        message: entry.message,
        link: entry.link,
      })),
    });
  }
}
