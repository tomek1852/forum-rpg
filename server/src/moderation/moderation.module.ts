import { Module } from "@nestjs/common";
import { RolesGuard } from "../common/guards/roles.guard";
import { NotificationsModule } from "../notifications/notifications.module";
import { ModerationController } from "./moderation.controller";
import { ModerationService } from "./moderation.service";

@Module({
  imports: [NotificationsModule],
  controllers: [ModerationController],
  providers: [ModerationService, RolesGuard],
})
export class ModerationModule {}
