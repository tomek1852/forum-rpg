import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { AccountStatus, UserRole } from "@prisma/client";
import { AuthService } from "./auth.service";

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue("hashed-password"),
}));

const bcrypt = jest.requireMock("bcrypt") as {
  compare: jest.Mock;
};

describe("AuthService", () => {
  const user = {
    id: "user-1",
    email: "test@example.com",
    username: "hero",
    passwordHash: "db-hash",
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
  };

  const pendingUser = {
    ...user,
    status: AccountStatus.PENDING_APPROVAL,
    emailVerified: false,
  };

  const prisma = {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    emailVerificationToken: {
      create: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn().mockResolvedValue({
        id: "session-1",
        userId: "user-1",
        tokenHash: "placeholder",
        expiresAt: new Date(),
      }),
      update: jest.fn(),
    },
  };

  const usersService = {
    createUser: jest.fn().mockResolvedValue(user),
    findByEmail: jest.fn(),
    findByEmailOrUsername: jest.fn(),
    touchLastSeen: jest.fn(),
    toPublicUser: jest.fn().mockReturnValue({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      lastSeenAt: user.lastSeenAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }),
  };

  const jwtService = {
    signAsync: jest
      .fn()
      .mockResolvedValueOnce("access-token")
      .mockResolvedValueOnce("refresh-token"),
  };

  const configService = {
    get: jest.fn((key: string, fallback?: string) => fallback),
    getOrThrow: jest.fn((key: string) => `secret-for-${key}`),
  } as unknown as ConfigService;
  const mailerService = {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.refreshToken.create.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      tokenHash: "placeholder",
      expiresAt: new Date(),
    });
    prisma.user.update.mockResolvedValue(user);
    prisma.emailVerificationToken.create.mockResolvedValue({
      id: "verify-1",
      userId: "user-1",
      tokenHash: "hashed",
      expiresAt: new Date(),
    });
    prisma.user.findFirst.mockResolvedValue(null);
    usersService.findByEmailOrUsername.mockResolvedValue(user);
    usersService.createUser.mockResolvedValue(user);
    usersService.findByEmail.mockResolvedValue(user);
    usersService.touchLastSeen.mockResolvedValue(user);
    usersService.toPublicUser.mockReturnValue({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      lastSeenAt: user.lastSeenAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
    jwtService.signAsync = jest
      .fn()
      .mockResolvedValueOnce("access-token")
      .mockResolvedValueOnce("refresh-token");
    service = new AuthService(
      usersService as never,
      prisma as never,
      jwtService as never,
      configService,
      mailerService as never,
    );
  });

  it("registers a new user and returns verification instructions", async () => {
    usersService.createUser.mockResolvedValueOnce(pendingUser);

    const result = await service.register({
      email: "test@example.com",
      username: "hero",
      password: "supersecret",
    });

    expect(usersService.createUser).toHaveBeenCalled();
    expect(prisma.emailVerificationToken.create).toHaveBeenCalled();
    expect(mailerService.sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: pendingUser.email,
        username: pendingUser.username,
      }),
    );
    expect(result.message).toContain("Zweryfikuj e-mail");
    expect(result.user.username).toBe("hero");
  });

  it("throws when user already exists", async () => {
    prisma.user.findFirst.mockResolvedValueOnce(user);

    await expect(
      service.register({
        email: "test@example.com",
        username: "hero",
        password: "supersecret",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("rejects invalid login password", async () => {
    bcrypt.compare.mockResolvedValueOnce(false);

    await expect(
      service.login({
        identifier: "test@example.com",
        password: "badpass123",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("blocks login for accounts pending verification", async () => {
    usersService.findByEmailOrUsername.mockResolvedValueOnce(pendingUser);

    await expect(
      service.login({
        identifier: "test@example.com",
        password: "supersecret",
      }),
    ).rejects.toThrow("Zweryfikuj e-mail");
  });

  it("blocks login for accounts waiting for approval", async () => {
    usersService.findByEmailOrUsername.mockResolvedValueOnce({
      ...user,
      status: AccountStatus.PENDING_APPROVAL,
      emailVerified: true,
    });

    await expect(
      service.login({
        identifier: "test@example.com",
        password: "supersecret",
      }),
    ).rejects.toThrow("Konto czeka na zatwierdzenie");
  });

  it("verifies email token and keeps the account pending approval", async () => {
    prisma.emailVerificationToken.findUnique.mockResolvedValueOnce({
      id: "verify-1",
      userId: "user-1",
      tokenHash: "hashed",
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      createdAt: new Date(),
      user,
    });
    prisma.$transaction = jest.fn().mockResolvedValue([]);

    const result = await service.verifyEmail({
      token: "raw-token",
    });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result.message).toContain("Konto czeka teraz na zatwierdzenie");
  });
});
