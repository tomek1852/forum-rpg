import { Module } from "@nestjs/common";
import { RolesGuard } from "../common/guards/roles.guard";
import { NotificationsModule } from "../notifications/notifications.module";
import { SkillsController } from "./skills.controller";
import { SkillsService } from "./skills.service";

@Module({
  imports: [NotificationsModule],
  controllers: [SkillsController],
  providers: [SkillsService, RolesGuard],
  exports: [SkillsService],
})
export class SkillsModule {}
