import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { MailerService } from "../mailer/mailer.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsRealtimeService } from "./notifications-realtime.service";

type NotificationCreateInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
};

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MailerService) private readonly mailerService: MailerService,
    @Inject(NotificationsRealtimeService)
    private readonly notificationsRealtimeService: NotificationsRealtimeService,
  ) {}

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

    const createdNotifications = await this.prisma.$transaction((tx) =>
      Promise.all(
        values.map((entry) =>
          tx.notification.create({
            data: {
              userId: entry.userId,
              type: entry.type,
              title: entry.title,
              message: entry.message,
              link: entry.link,
            },
          }),
        ),
      ),
    );

    const uniqueRecipientIds = [...new Set(values.map((entry) => entry.userId))];
    const unreadCountEntries = await Promise.all(
      uniqueRecipientIds.map(
        async (userId): Promise<[string, number]> => [
          userId,
          await this.prisma.notification.count({
            where: {
              userId,
              isRead: false,
            },
          }),
        ],
      ),
    );
    const unreadCounts = new Map<string, number>(unreadCountEntries);

    for (const notification of createdNotifications) {
      this.notificationsRealtimeService.emitNotificationCreated(notification.userId, {
        notification,
        unreadCount: unreadCounts.get(notification.userId) ?? 0,
      });
    }

    const recipients = await this.prisma.user.findMany({
      where: {
        id: { in: values.map((entry) => entry.userId) },
        isActive: true,
        emailVerified: true,
        status: "ACTIVE",
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
      },
    });

    const recipientMap = new Map(
      recipients.map((recipient) => [recipient.id, recipient]),
    );

    await Promise.all(
      values.map(async (entry) => {
        const recipient = recipientMap.get(entry.userId);

        if (!recipient) {
          return;
        }

        await this.mailerService.sendNotificationEmail({
          email: recipient.email,
          username: recipient.displayName || recipient.username,
          title: entry.title,
          message: entry.message,
          link: entry.link,
        });
      }),
    );
  }
}
