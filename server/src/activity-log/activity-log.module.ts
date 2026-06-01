import { Module } from "@nestjs/common";
import { RolesGuard } from "../common/guards/roles.guard";
import { ActivityLogController } from "./activity-log.controller";
import { ActivityLogService } from "./activity-log.service";

@Module({
  controllers: [ActivityLogController],
  providers: [ActivityLogService, RolesGuard],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
