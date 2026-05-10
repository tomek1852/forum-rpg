import { Inject, Injectable } from "@nestjs/common";
import type { Notification } from "@prisma/client";
import { NotificationsGateway } from "./notifications.gateway";

export type NotificationCreatedPayload = {
  notification: Notification;
  unreadCount: number;
};

@Injectable()
export class NotificationsRealtimeService {
  constructor(
    @Inject(NotificationsGateway)
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  emitNotificationCreated(userId: string, payload: NotificationCreatedPayload) {
    this.notificationsGateway.emitNotificationCreated(userId, payload);
  }
}
