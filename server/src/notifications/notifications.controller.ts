import { Controller, Get, Inject, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    @Inject(NotificationsService)
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  listMine(@CurrentUser() user: { userId: string }) {
    return this.notificationsService.listMine(user.userId);
  }

  @Patch("read-all")
  markAllAsRead(@CurrentUser() user: { userId: string }) {
    return this.notificationsService.markAllAsRead(user.userId);
  }

  @Patch(":notificationId/read")
  markAsRead(
    @CurrentUser() user: { userId: string },
    @Param("notificationId") notificationId: string,
  ) {
    return this.notificationsService.markAsRead(user.userId, notificationId);
  }
}
