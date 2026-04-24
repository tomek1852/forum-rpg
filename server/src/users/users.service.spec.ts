import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { AccountStatus, UserRole } from "@prisma/client";
import { UsersService } from "./users.service";

describe("UsersService", () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(prisma as never);
  });

  it("lists moderation accounts ordered by status and creation date", async () => {
    prisma.user.findMany.mockResolvedValueOnce([
      {
        id: "user-1",
        email: "one@example.com",
        username: "one",
        passwordHash: "hash",
        role: UserRole.PLAYER,
        status: AccountStatus.PENDING_APPROVAL,
        isActive: true,
        emailVerified: true,
        displayName: null,
        bio: null,
        avatarUrl: null,
        lastSeenAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await service.listModerationAccounts();

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
    expect(result.users).toHaveLength(1);
  });

  it("prevents activating an account without verified email", async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: "user-1",
      email: "one@example.com",
      username: "one",
      passwordHash: "hash",
      role: UserRole.PLAYER,
      status: AccountStatus.PENDING_APPROVAL,
      isActive: true,
      emailVerified: false,
      displayName: null,
      bio: null,
      avatarUrl: null,
      lastSeenAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.updateAccountStatus(
        "user-1",
        AccountStatus.ACTIVE,
        { userId: "gm-1", role: UserRole.GM },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("blocks GM from changing admin status", async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: "admin-1",
      email: "admin@example.com",
      username: "admin",
      passwordHash: "hash",
      role: UserRole.ADMIN,
      status: AccountStatus.ACTIVE,
      isActive: true,
      emailVerified: true,
      displayName: null,
      bio: null,
      avatarUrl: null,
      lastSeenAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.updateAccountStatus(
        "admin-1",
        AccountStatus.BLOCKED,
        { userId: "gm-1", role: UserRole.GM },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("updates the selected user role", async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: "user-1",
      email: "one@example.com",
      username: "one",
      passwordHash: "hash",
      role: UserRole.PLAYER,
      status: AccountStatus.ACTIVE,
      isActive: true,
      emailVerified: true,
      displayName: null,
      bio: null,
      avatarUrl: null,
      lastSeenAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.user.update.mockResolvedValueOnce({
      id: "user-1",
      email: "one@example.com",
      username: "one",
      passwordHash: "hash",
      role: UserRole.GM,
      status: AccountStatus.ACTIVE,
      isActive: true,
      emailVerified: true,
      displayName: null,
      bio: null,
      avatarUrl: null,
      lastSeenAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.updateUserRole(
      "user-1",
      UserRole.GM,
      { userId: "admin-1", role: UserRole.ADMIN },
    );

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { role: UserRole.GM },
    });
    expect(result.user.role).toBe(UserRole.GM);
  });

  it("throws when moderation target does not exist", async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.updateUserRole(
        "missing",
        UserRole.GM,
        { userId: "admin-1", role: UserRole.ADMIN },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
