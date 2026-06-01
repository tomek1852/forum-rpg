import { AccountStatus, UserRole } from "@prisma/client";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "../common/guards/roles.guard";
import { AdminService } from "./admin.service";

const makeUser = (overrides: Partial<{
  id: string;
  email: string;
  username: string;
  role: UserRole;
  status: AccountStatus;
}> = {}) => ({
  id: "user-1",
  email: "test@example.com",
  username: "testuser",
  displayName: null,
  bio: null,
  avatarUrl: null,
  role: UserRole.PLAYER,
  status: AccountStatus.ACTIVE,
  emailVerified: true,
  presenceStatus: "OFFLINE",
  lastSeenAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("AdminService", () => {
  const prisma = {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    activityLog: {
      findMany: jest.fn(),
    },
    moderationReport: {
      groupBy: jest.fn(),
    },
    character: {
      count: jest.fn(),
    },
    conversation: {
      count: jest.fn(),
    },
  };

  let service: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminService(prisma as never);
  });

  it("wyszukiwanie po username zwraca poprawne wyniki", async () => {
    const user = makeUser({ username: "alicja" });
    prisma.user.findMany.mockResolvedValueOnce([user]);
    prisma.user.count.mockResolvedValueOnce(1);

    const result = await service.listUsers({ search: "ali" });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ username: expect.objectContaining({ contains: "ali" }) }),
            expect.objectContaining({ email: expect.objectContaining({ contains: "ali" }) }),
          ]),
        }),
      }),
    );
    expect(result.users).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("filtr statusu PENDING_APPROVAL zwraca tylko oczekujące konta", async () => {
    const pending = makeUser({ status: AccountStatus.PENDING_APPROVAL });
    prisma.user.findMany.mockResolvedValueOnce([pending]);
    prisma.user.count.mockResolvedValueOnce(1);

    const result = await service.listUsers({ status: AccountStatus.PENDING_APPROVAL });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: AccountStatus.PENDING_APPROVAL }),
      }),
    );
    expect(result.users[0].status).toBe(AccountStatus.PENDING_APPROVAL);
  });

  it("getStats zwraca poprawne agregaty", async () => {
    prisma.user.groupBy
      .mockResolvedValueOnce([
        { status: "ACTIVE", _count: { _all: 10 } },
        { status: "BLOCKED", _count: { _all: 2 } },
      ])
      .mockResolvedValueOnce([
        { role: "PLAYER", _count: { _all: 9 } },
        { role: "ADMIN", _count: { _all: 1 } },
      ]);
    prisma.moderationReport.groupBy.mockResolvedValueOnce([
      { status: "OPEN", _count: { _all: 3 } },
    ]);
    prisma.character.count.mockResolvedValueOnce(15);
    prisma.conversation.count.mockResolvedValueOnce(7);

    const stats = await service.getStats();

    expect(stats.usersByStatus["ACTIVE"]).toBe(10);
    expect(stats.usersByRole["PLAYER"]).toBe(9);
    expect(stats.reportsByStatus["OPEN"]).toBe(3);
    expect(stats.characterCount).toBe(15);
    expect(stats.activeConversationCount).toBe(7);
  });

  it("paginacja respektuje parametry page i limit", async () => {
    prisma.user.findMany.mockResolvedValueOnce([]);
    prisma.user.count.mockResolvedValueOnce(0);

    await service.listUsers({ page: 3, limit: 10 });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 }),
    );
  });
});

describe("RolesGuard — GM otrzymuje 403 na /admin/users", () => {
  it("zwraca false dla roli GM gdy wymagana jest ADMIN", () => {
    const { Reflector: ActualReflector } = jest.requireActual("@nestjs/core");
    const reflector = new ActualReflector();
    const guard = new RolesGuard(reflector);

    jest.spyOn(reflector, "getAllAndOverride").mockReturnValueOnce(["ADMIN"]);

    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: "GM" } }),
      }),
    };

    expect(guard.canActivate(ctx as never)).toBe(false);
  });
});
