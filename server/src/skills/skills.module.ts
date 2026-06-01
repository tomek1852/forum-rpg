import { Module } from "@nestjs/common";
import { ActivityLogModule } from "../activity-log/activity-log.module";
import { BadgesModule } from "../badges/badges.module";
import { RolesGuard } from "../common/guards/roles.guard";
import { NotificationsModule } from "../notifications/notifications.module";
import { SkillsController } from "./skills.controller";
import { SkillsService } from "./skills.service";

@Module({
  imports: [NotificationsModule, ActivityLogModule, BadgesModule],
  controllers: [SkillsController],
  providers: [SkillsService, RolesGuard],
  exports: [SkillsService],
})
export class SkillsModule {}
