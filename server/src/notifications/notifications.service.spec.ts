import { NotFoundException } from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { NotificationsService } from "./notifications.service";

describe("NotificationsService", () => {
  const prisma = {
    $transaction: jest.fn(),
    user: {
      findMany: jest.fn(),
    },
    notification: {
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
      createMany: jest.fn(),
      create: jest.fn(),
    },
  };
  const mailerService = {
    sendNotificationEmail: jest.fn(),
  };
  const notificationsRealtimeService = {
    emitNotificationCreated: jest.fn(),
  };

  let service: NotificationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        notification: {
          create: prisma.notification.create,
        },
      }),
    );
    service = new NotificationsService(
      prisma as never,
      mailerService as never,
      notificationsRealtimeService as never,
    );
  });

  it("lists notifications with unread count", async () => {
    prisma.notification.findMany.mockResolvedValueOnce([{ id: "notif-1" }]);
    prisma.notification.count.mockResolvedValueOnce(2);

    const result = await service.listMine("user-1");

    expect(result.notifications).toHaveLength(1);
    expect(result.unreadCount).toBe(2);
  });

  it("throws when marking a missing notification as read", async () => {
    prisma.notification.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      service.markAsRead("user-1", "missing"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("creates notifications for distinct recipients", async () => {
    prisma.notification.create.mockResolvedValueOnce({
      id: "notif-1",
      userId: "user-1",
      type: NotificationType.FORUM_THREAD_REPLY,
      title: "Nowa odpowiedz",
      message: "Test",
      link: "/forum/1/1",
      isRead: false,
      createdAt: new Date("2026-05-10T10:00:00.000Z"),
      readAt: null,
    });
    prisma.notification.create.mockResolvedValueOnce({
      id: "notif-2",
      userId: "user-2",
      type: NotificationType.FORUM_POST_QUOTE,
      title: "Cytat",
      message: "Test 2",
      link: "/forum/1/1#post-2",
      isRead: false,
      createdAt: new Date("2026-05-10T10:01:00.000Z"),
      readAt: null,
    });
    prisma.notification.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);
    prisma.user.findMany.mockResolvedValueOnce([
      {
        id: "user-1",
        email: "user1@example.com",
        username: "user1",
        displayName: null,
      },
      {
        id: "user-2",
        email: "user2@example.com",
        username: "user2",
        displayName: "User Two",
      },
    ]);

    await service.createForUsers([
      {
        userId: "user-1",
        type: NotificationType.FORUM_THREAD_REPLY,
        title: "Nowa odpowiedz",
        message: "Test",
        link: "/forum/1/1",
      },
      {
        userId: "user-1",
        type: NotificationType.FORUM_THREAD_REPLY,
        title: "Nowa odpowiedz",
        message: "Test",
        link: "/forum/1/1",
      },
      {
        userId: "user-2",
        type: NotificationType.FORUM_POST_QUOTE,
        title: "Cytat",
        message: "Test 2",
        link: "/forum/1/1#post-2",
      },
    ]);

    expect(prisma.notification.create).toHaveBeenNthCalledWith(1, {
      data: {
        userId: "user-1",
        type: NotificationType.FORUM_THREAD_REPLY,
        title: "Nowa odpowiedz",
        message: "Test",
        link: "/forum/1/1",
      },
    });
    expect(prisma.notification.create).toHaveBeenNthCalledWith(2, {
      data: {
        userId: "user-2",
        type: NotificationType.FORUM_POST_QUOTE,
        title: "Cytat",
        message: "Test 2",
        link: "/forum/1/1#post-2",
      },
    });
    expect(mailerService.sendNotificationEmail).toHaveBeenCalledTimes(2);
    expect(notificationsRealtimeService.emitNotificationCreated).toHaveBeenCalledTimes(2);
    expect(notificationsRealtimeService.emitNotificationCreated).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        unreadCount: 1,
        notification: expect.objectContaining({
          id: "notif-1",
        }),
      }),
    );
  });
});
