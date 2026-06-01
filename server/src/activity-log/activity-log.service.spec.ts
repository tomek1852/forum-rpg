import { ActivityLogService } from "./activity-log.service";

describe("ActivityLogService", () => {
  const prisma = {
    activityLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  let service: ActivityLogService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ActivityLogService(prisma as never);
  });

  it("log jest tworzony przy blokadzie konta", async () => {
    prisma.activityLog.create.mockResolvedValueOnce({ id: "log-1" });

    await service.log("admin-1", "user.block", "user", "user-2", { status: "BLOCKED" });

    expect(prisma.activityLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorId: "admin-1",
          action: "user.block",
          targetType: "user",
          targetId: "user-2",
        }),
      }),
    );
  });

  it("log jest tworzony przy zmianie statusu ModerationReport", async () => {
    prisma.activityLog.create.mockResolvedValueOnce({ id: "log-2" });

    await service.log("admin-1", "moderation.resolve_report", "moderation_report", "report-1", {
      status: "RESOLVED",
    });

    expect(prisma.activityLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorId: "admin-1",
          action: "moderation.resolve_report",
          targetType: "moderation_report",
          targetId: "report-1",
        }),
      }),
    );
  });

  it("endpoint /admin/activity-log zwraca 403 dla roli GM — RolesGuard odrzuca żądanie", () => {
    const { Reflector } = jest.requireActual("@nestjs/core");
    const { RolesGuard } = jest.requireActual("../common/guards/roles.guard");

    const reflector = new Reflector();
    const guard = new RolesGuard(reflector);

    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: "GM" } }),
      }),
    };

    jest.spyOn(reflector, "getAllAndOverride").mockReturnValueOnce(["ADMIN"]);

    const canActivate = guard.canActivate(mockContext as never);
    expect(canActivate).toBe(false);
  });

  it("paginacja zwraca poprawną stronę wyników z nextCursor", async () => {
    const entries = Array.from({ length: 21 }, (_, i) => ({
      id: `log-${i + 1}`,
      actorId: "admin-1",
      action: "user.block",
      targetType: "user",
      targetId: `user-${i + 1}`,
      meta: null,
      createdAt: new Date(),
      actor: { id: "admin-1", username: "admin", displayName: null },
    }));

    prisma.activityLog.findMany.mockResolvedValueOnce(entries);

    const result = await service.list({ limit: 20 });

    expect(result.entries).toHaveLength(20);
    expect(result.nextCursor).toBe("log-20");
  });

  it("paginacja zwraca nextCursor null gdy nie ma więcej wpisów", async () => {
    const entries = Array.from({ length: 5 }, (_, i) => ({
      id: `log-${i + 1}`,
      actorId: "admin-1",
      action: "user.block",
      targetType: "user",
      targetId: `user-${i + 1}`,
      meta: null,
      createdAt: new Date(),
      actor: { id: "admin-1", username: "admin", displayName: null },
    }));

    prisma.activityLog.findMany.mockResolvedValueOnce(entries);

    const result = await service.list({ limit: 20 });

    expect(result.entries).toHaveLength(5);
    expect(result.nextCursor).toBeNull();
  });
});
