import {
  applyNotificationCreatedEvent,
  type NotificationCreatedEvent,
} from "./notifications-realtime";
import type { NotificationsResponse } from "./types";

describe("applyNotificationCreatedEvent", () => {
  it("prepends the incoming notification and refreshes unread count", () => {
    const current: NotificationsResponse = {
      unreadCount: 1,
      notifications: [
        {
          id: "notif-1",
          type: "FORUM_THREAD_REPLY",
          title: "Starsza odpowiedz",
          message: "Starsza tresc",
          link: "/forum/1/1",
          isRead: false,
          createdAt: "2026-05-10T10:00:00.000Z",
          readAt: null,
          userId: "user-1",
        },
      ],
    };
    const event: NotificationCreatedEvent = {
      unreadCount: 2,
      notification: {
        id: "notif-2",
        type: "FORUM_POST_QUOTE",
        title: "Nowy cytat",
        message: "Nowa tresc",
        link: "/forum/1/2",
        isRead: false,
        createdAt: "2026-05-10T10:05:00.000Z",
        readAt: null,
        userId: "user-1",
      },
    };

    const result = applyNotificationCreatedEvent(current, event);

    expect(result.unreadCount).toBe(2);
    expect(result.notifications.map((notification) => notification.id)).toEqual([
      "notif-2",
      "notif-1",
    ]);
  });
});
