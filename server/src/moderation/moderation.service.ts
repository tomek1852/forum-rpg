import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ModerationReportStatus, ModerationReportTargetType, NotificationType } from "@prisma/client";
import { ActivityLogService } from "../activity-log/activity-log.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateReportDto } from "./dto/create-report.dto";
import { UpdateReportDto } from "./dto/update-report.dto";

const reportInclude = {
  reporter: { select: { id: true, username: true, displayName: true } },
  resolvedBy: { select: { id: true, username: true, displayName: true } },
} as const;

@Injectable()
export class ModerationService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService) private readonly notificationsService: NotificationsService,
    @Inject(ActivityLogService) private readonly activityLog: ActivityLogService,
  ) {}

  async createReport(reporterId: string, dto: CreateReportDto) {
    const report = await this.prisma.moderationReport.create({
      data: {
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
      },
      include: reportInclude,
    });

    return { message: "Zgłoszenie zostało wysłane.", report };
  }

  async listReports(filters: {
    status?: ModerationReportStatus;
    targetType?: ModerationReportTargetType;
  }) {
    const reports = await this.prisma.moderationReport.findMany({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.targetType ? { targetType: filters.targetType } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: reportInclude,
    });

    return { reports };
  }

  async getReport(id: string) {
    const report = await this.prisma.moderationReport.findUnique({
      where: { id },
      include: reportInclude,
    });

    if (!report) {
      throw new NotFoundException("Zgłoszenie nie zostało znalezione.");
    }

    return { report };
  }

  async updateReport(id: string, reviewerId: string, dto: UpdateReportDto) {
    const existing = await this.prisma.moderationReport.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException("Zgłoszenie nie zostało znalezione.");
    }

    const report = await this.prisma.moderationReport.update({
      where: { id },
      data: {
        status: dto.status,
        resolution: dto.resolution,
        resolvedById: reviewerId,
      },
      include: reportInclude,
    });

    if (dto.status === ModerationReportStatus.RESOLVED) {
      await this.notificationsService.createForUsers([
        {
          userId: report.reporterId,
          type: NotificationType.MODERATION_REPORT_RESOLVED,
          title: "Zgłoszenie rozpatrzone",
          message: `Twoje zgłoszenie zostało rozpatrzone.${report.resolution ? ` Decyzja: ${report.resolution}` : ""}`,
          link: "/moderation",
        },
      ]);
    }

    const action =
      dto.status === ModerationReportStatus.RESOLVED
        ? "moderation.resolve_report"
        : dto.status === ModerationReportStatus.DISMISSED
          ? "moderation.dismiss_report"
          : "moderation.update_report";

    await this.activityLog.log(reviewerId, action, "moderation_report", id, {
      status: dto.status,
      targetType: report.targetType,
      targetId: report.targetId,
    });

    return { message: "Status zgłoszenia został zaktualizowany.", report };
  }
}
