import { NotFoundException } from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { NotificationsService } from "./notifications.service";

describe("NotificationsService", () => {
  const prisma = {
    notification: {
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
      createMany: jest.fn(),
    },
  };

  let service: NotificationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationsService(prisma as never);
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

    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: [
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
      ],
    });
  });
});
