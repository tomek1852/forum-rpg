"use client";

import type { QueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  disconnectNotificationsSocket,
  getNotificationsSocket,
} from "./notifications-socket";
import type { Notification, NotificationsResponse } from "./types";

export type NotificationCreatedEvent = {
  notification: Notification;
  unreadCount: number;
};

export function applyNotificationCreatedEvent(
  current: NotificationsResponse | undefined,
  event: NotificationCreatedEvent,
): NotificationsResponse {
  const nextNotifications = [
    event.notification,
    ...(current?.notifications ?? []).filter(
      (notification) => notification.id !== event.notification.id,
    ),
  ]
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )
    .slice(0, 50);

  return {
    notifications: nextNotifications,
    unreadCount: event.unreadCount,
  };
}

export function useNotificationsRealtime({
  accessToken,
  hydrated,
  queryClient,
}: {
  accessToken: string | null;
  hydrated: boolean;
  queryClient: QueryClient;
}) {
  useEffect(() => {
    if (!hydrated || !accessToken) {
      disconnectNotificationsSocket();
      return;
    }

    const socket = getNotificationsSocket(accessToken);
    socket.connect();

    const handleNotificationCreated = (event: NotificationCreatedEvent) => {
      queryClient.setQueryData<NotificationsResponse | undefined>(
        ["notifications"],
        (current) => applyNotificationCreatedEvent(current, event),
      );
    };

    socket.on("notification.created", handleNotificationCreated);

    return () => {
      socket.off("notification.created", handleNotificationCreated);
      socket.disconnect();
    };
  }, [accessToken, hydrated, queryClient]);
}
