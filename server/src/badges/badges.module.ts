import { Module } from "@nestjs/common";
import { RolesGuard } from "../common/guards/roles.guard";
import { NotificationsModule } from "../notifications/notifications.module";
import { BadgesController } from "./badges.controller";
import { BadgesService } from "./badges.service";

@Module({
  imports: [NotificationsModule],
  controllers: [BadgesController],
  providers: [BadgesService, RolesGuard],
  exports: [BadgesService],
})
export class BadgesModule {}
