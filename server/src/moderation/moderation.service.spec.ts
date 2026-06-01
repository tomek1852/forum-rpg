import { NotFoundException } from "@nestjs/common";
import { ModerationReportStatus, ModerationReportTargetType } from "@prisma/client";
import { ModerationService } from "./moderation.service";

describe("ModerationService", () => {
  const notificationsService = {
    createForUsers: jest.fn(),
  };

  const prisma = {
    moderationReport: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const activityLog = { log: jest.fn() };

  let service: ModerationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ModerationService(prisma as never, notificationsService as never, activityLog as never);
  });

  it("gracz może zgłosić post", async () => {
    const report = {
      id: "report-1",
      reporterId: "player-1",
      targetType: ModerationReportTargetType.POST,
      targetId: "post-1",
      reason: "Nieodpowiednia treść posta.",
      status: ModerationReportStatus.OPEN,
      resolvedById: null,
      resolution: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      reporter: { id: "player-1", username: "gracz", displayName: null },
      resolvedBy: null,
    };

    prisma.moderationReport.create.mockResolvedValueOnce(report);

    const result = await service.createReport("player-1", {
      targetType: ModerationReportTargetType.POST,
      targetId: "post-1",
      reason: "Nieodpowiednia treść posta.",
    });

    expect(result.report).toEqual(report);
    expect(prisma.moderationReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reporterId: "player-1",
          targetType: ModerationReportTargetType.POST,
          targetId: "post-1",
        }),
      }),
    );
  });

  it("GM widzi listę zgłoszeń", async () => {
    const reports = [
      {
        id: "report-1",
        reporterId: "player-1",
        targetType: ModerationReportTargetType.POST,
        targetId: "post-1",
        reason: "Nieodpowiednia treść.",
        status: ModerationReportStatus.OPEN,
        resolvedById: null,
        resolution: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        reporter: { id: "player-1", username: "gracz", displayName: null },
        resolvedBy: null,
      },
    ];

    prisma.moderationReport.findMany.mockResolvedValueOnce(reports);

    const result = await service.listReports({});

    expect(result.reports).toHaveLength(1);
    expect(result.reports[0].id).toBe("report-1");
  });

  it("GM może zmienić status na RESOLVED z resolution i wysyła powiadomienie", async () => {
    const existing = { id: "report-1", reporterId: "player-1" };
    const updated = {
      id: "report-1",
      reporterId: "player-1",
      targetType: ModerationReportTargetType.POST,
      targetId: "post-1",
      reason: "Nieodpowiednia treść.",
      status: ModerationReportStatus.RESOLVED,
      resolvedById: "gm-1",
      resolution: "Treść usunięta.",
      createdAt: new Date(),
      updatedAt: new Date(),
      reporter: { id: "player-1", username: "gracz", displayName: null },
      resolvedBy: { id: "gm-1", username: "gm", displayName: "Mistrz Gry" },
    };

    prisma.moderationReport.findUnique.mockResolvedValueOnce(existing);
    prisma.moderationReport.update.mockResolvedValueOnce(updated);

    const result = await service.updateReport("report-1", "gm-1", {
      status: ModerationReportStatus.RESOLVED,
      resolution: "Treść usunięta.",
    });

    expect(result.report.status).toBe(ModerationReportStatus.RESOLVED);
    expect(notificationsService.createForUsers).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          userId: "player-1",
          type: "MODERATION_REPORT_RESOLVED",
        }),
      ]),
    );
  });

  it("gracz nie może pobrać listy wszystkich zgłoszeń — guard odrzuca żądanie bez roli GM/ADMIN", () => {
    // RolesGuard sprawdza req.user.role vs @Roles("GM", "ADMIN") na poziomie kontrolera.
    // Symulacja: user bez wymaganej roli.
    const { Reflector } = jest.requireActual("@nestjs/core");
    const { RolesGuard } = jest.requireActual("../common/guards/roles.guard");

    const reflector = new Reflector();
    const guard = new RolesGuard(reflector);

    const mockContext = {
      getHandler: () => ({ __roles: ["GM", "ADMIN"] }),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: "PLAYER" } }),
      }),
    };

    jest.spyOn(reflector, "getAllAndOverride").mockReturnValueOnce(["GM", "ADMIN"]);

    const canActivate = guard.canActivate(mockContext as never);
    expect(canActivate).toBe(false);
  });

  it("updateReport rzuca NotFoundException gdy zgłoszenie nie istnieje", async () => {
    prisma.moderationReport.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.updateReport("nonexistent", "gm-1", {
        status: ModerationReportStatus.IN_REVIEW,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
