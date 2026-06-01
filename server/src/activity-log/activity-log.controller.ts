import { Controller, Get, Inject, Query, UseGuards } from "@nestjs/common";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { ActivityLogService } from "./activity-log.service";

@Controller("admin/activity-log")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class ActivityLogController {
  constructor(
    @Inject(ActivityLogService) private readonly activityLogService: ActivityLogService,
  ) {}

  @Get()
  list(
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
    @Query("actorId") actorId?: string,
    @Query("action") action?: string,
    @Query("targetType") targetType?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.activityLogService.list({
      cursor,
      limit: limit ? Number(limit) : undefined,
      actorId,
      action,
      targetType,
      from,
      to,
    });
  }
}
