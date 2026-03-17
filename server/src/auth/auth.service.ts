import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { RefreshToken, User } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { createHash, randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import { AuthResponse, AccessTokenPayload, RefreshTokenPayload } from "./auth.types";
import { ttlToMilliseconds } from "./auth.utils";
import { LoginDto } from "./dto/login.dto";
import { LogoutDto } from "./dto/logout.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";
import { RequestPasswordResetDto } from "./dto/request-password-reset.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@Injectable()
export class AuthService {
  private readonly accessTokenTtl: string;
  private readonly refreshTokenTtl: string;
  private readonly resetTokenTtlMinutes: number;
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;

  constructor(
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(JwtService)
    private readonly jwtService: JwtService,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {
    this.accessTokenTtl = this.configService.get("ACCESS_TOKEN_TTL", "15m");
    this.refreshTokenTtl = this.configService.get("REFRESH_TOKEN_TTL", "7d");
    this.resetTokenTtlMinutes = Number(
      this.configService.get("RESET_TOKEN_TTL_MINUTES", "60"),
    );
    this.accessTokenSecret =
      this.configService.getOrThrow<string>("JWT_ACCESS_SECRET");
    this.refreshTokenSecret =
      this.configService.getOrThrow<string>("JWT_REFRESH_SECRET");
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    const username = dto.username.trim();

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new ConflictException(
        "Uzytkownik z takim adresem e-mail lub nazwa juz istnieje.",
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.usersService.createUser({
      email,
      username,
      passwordHash,
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const identifier = dto.identifier.trim().toLowerCase();
    const user = await this.usersService.findByEmailOrUsername(identifier);

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Nieprawidlowy login lub haslo.");
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException("Nieprawidlowy login lub haslo.");
    }

    return this.buildAuthResponse(user);
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthResponse> {
    const payload = await this.verifyRefreshToken(dto.refreshToken);

    const session = await this.prisma.refreshToken.findUnique({
      where: { id: payload.jti },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException("Refresh token wygasl.");
    }

    this.assertSessionIsValid(session, dto.refreshToken);

    await this.prisma.refreshToken.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.buildAuthResponse(session.user);
  }

  async logout(dto: LogoutDto) {
    try {
      const payload = await this.verifyRefreshToken(dto.refreshToken);

      await this.prisma.refreshToken.updateMany({
        where: {
          id: payload.jti,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    } catch {
      return {
        message: "Sesja zostala zakonczona lokalnie.",
      };
    }

    return {
      message: "Wylogowano pomyslnie.",
    };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return {
        message:
          "Jezeli konto istnieje, wyslalismy instrukcje resetu hasla.",
      };
    }

    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(rawToken);

    await this.prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt: new Date(
          Date.now() + this.resetTokenTtlMinutes * 60_000,
        ),
      },
    });

    return {
      message:
        "Jezeli konto istnieje, wyslalismy instrukcje resetu hasla.",
      developmentResetToken:
        process.env.NODE_ENV === "production" ? undefined : rawToken,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashToken(dto.token);
    const resetEntry = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !resetEntry ||
      resetEntry.usedAt ||
      resetEntry.expiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException("Token resetu hasla jest nieprawidlowy.");
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetEntry.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetEntry.id },
        data: { usedAt: now },
      }),
      this.prisma.refreshToken.updateMany({
        where: {
          userId: resetEntry.userId,
          revokedAt: null,
        },
        data: { revokedAt: now },
      }),
    ]);

    return {
      message: "Haslo zostalo zmienione.",
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Sesja wygasla.");
    }

    return {
      user: this.usersService.toPublicUser(user),
    };
  }

  private async buildAuthResponse(user: User): Promise<AuthResponse> {
    const session = await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(randomBytes(32).toString("hex")),
        userId: user.id,
        expiresAt: new Date(
          Date.now() + ttlToMilliseconds(this.refreshTokenTtl),
        ),
      },
    });

    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: "access",
    };
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: session.id,
      type: "refresh",
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.accessTokenSecret,
        expiresIn: this.accessTokenTtl as never,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.refreshTokenSecret,
        expiresIn: this.refreshTokenTtl as never,
      }),
    ]);

    await this.prisma.refreshToken.update({
      where: { id: session.id },
      data: {
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + ttlToMilliseconds(this.refreshTokenTtl)),
      },
    });

    return {
      user: this.usersService.toPublicUser(user),
      tokens: {
        accessToken,
        refreshToken,
        accessTokenTtl: this.accessTokenTtl,
        refreshTokenTtl: this.refreshTokenTtl,
      },
    };
  }

  private assertSessionIsValid(
    session: RefreshToken & { user: User },
    refreshToken: string,
  ) {
    if (session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException("Refresh token wygasl.");
    }

    if (session.tokenHash !== this.hashToken(refreshToken)) {
      throw new UnauthorizedException("Refresh token jest nieprawidlowy.");
    }

    if (!session.user.isActive) {
      throw new UnauthorizedException("Konto jest nieaktywne.");
    }
  }

  private async verifyRefreshToken(refreshToken: string) {
    try {
      return await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.refreshTokenSecret,
        },
      );
    } catch {
      throw new UnauthorizedException("Refresh token jest nieprawidlowy.");
    }
  }

  private hashToken(value: string) {
    return createHash("sha256").update(value).digest("hex");
  }
}
