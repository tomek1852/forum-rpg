import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ModerationReportStatus, ModerationReportTargetType } from "@prisma/client";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CreateReportDto } from "./dto/create-report.dto";
import { UpdateReportDto } from "./dto/update-report.dto";
import { ModerationService } from "./moderation.service";

@Controller("moderation")
@UseGuards(JwtAuthGuard)
export class ModerationController {
  constructor(
    @Inject(ModerationService) private readonly moderationService: ModerationService,
  ) {}

  @Post("reports")
  createReport(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateReportDto,
  ) {
    return this.moderationService.createReport(user.userId, dto);
  }

  @Get("reports")
  @UseGuards(RolesGuard)
  @Roles("GM", "ADMIN")
  listReports(
    @Query("status") status?: ModerationReportStatus,
    @Query("targetType") targetType?: ModerationReportTargetType,
  ) {
    return this.moderationService.listReports({ status, targetType });
  }

  @Get("reports/:id")
  @UseGuards(RolesGuard)
  @Roles("GM", "ADMIN")
  getReport(@Param("id") id: string) {
    return this.moderationService.getReport(id);
  }

  @Patch("reports/:id")
  @UseGuards(RolesGuard)
  @Roles("GM", "ADMIN")
  updateReport(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateReportDto,
  ) {
    return this.moderationService.updateReport(id, user.userId, dto);
  }
}
