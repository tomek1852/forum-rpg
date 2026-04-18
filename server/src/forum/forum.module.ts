import { Module } from "@nestjs/common";
import { RolesGuard } from "../common/guards/roles.guard";
import { NotificationsModule } from "../notifications/notifications.module";
import { ForumController } from "./forum.controller";
import { ForumService } from "./forum.service";

@Module({
  imports: [NotificationsModule],
  controllers: [ForumController],
  providers: [ForumService, RolesGuard],
  exports: [ForumService],
})
export class ForumModule {}
