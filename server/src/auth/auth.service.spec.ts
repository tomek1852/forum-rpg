import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "@prisma/client";
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
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const prisma = {
    user: {
      findFirst: jest.fn(),
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
    findByEmailOrUsername: jest.fn(),
    toPublicUser: jest.fn().mockReturnValue({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
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

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.refreshToken.create.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      tokenHash: "placeholder",
      expiresAt: new Date(),
    });
    prisma.user.findFirst.mockResolvedValue(null);
    usersService.findByEmailOrUsername.mockResolvedValue(user);
    usersService.createUser.mockResolvedValue(user);
    usersService.toPublicUser.mockReturnValue({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
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
    );
  });

  it("registers a new user and returns tokens", async () => {
    const result = await service.register({
      email: "test@example.com",
      username: "hero",
      password: "supersecret",
    });

    expect(usersService.createUser).toHaveBeenCalled();
    expect(result.tokens.accessToken).toBe("access-token");
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
});
