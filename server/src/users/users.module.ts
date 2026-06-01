import { Module } from "@nestjs/common";
import { ActivityLogModule } from "../activity-log/activity-log.module";
import { RolesGuard } from "../common/guards/roles.guard";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [ActivityLogModule],
  controllers: [UsersController],
  providers: [UsersService, RolesGuard],
  exports: [UsersService],
})
export class UsersModule {}
