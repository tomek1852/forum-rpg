import { Module } from "@nestjs/common";
import { ActivityLogModule } from "../activity-log/activity-log.module";
import { RolesGuard } from "../common/guards/roles.guard";
import { NotificationsModule } from "../notifications/notifications.module";
import { ModerationController } from "./moderation.controller";
import { ModerationService } from "./moderation.service";

@Module({
  imports: [NotificationsModule, ActivityLogModule],
  controllers: [ModerationController],
  providers: [ModerationService, RolesGuard],
})
export class ModerationModule {}
