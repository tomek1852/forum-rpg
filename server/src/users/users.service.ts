import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

export type PublicUser = Pick<
  User,
  | "id"
  | "email"
  | "username"
  | "displayName"
  | "bio"
  | "avatarUrl"
  | "role"
  | "status"
  | "emailVerified"
  | "lastSeenAt"
  | "createdAt"
  | "updatedAt"
>;

@Injectable()
export class UsersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createUser(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByEmailOrUsername(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async touchLastSeen(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName?.trim() || null,
        bio: dto.bio?.trim() || null,
        avatarUrl: dto.avatarUrl?.trim() || null,
      },
    });

    return {
      user: this.toPublicUser(user),
    };
  }

  async getProfileById(userId: string) {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException("Nie znaleziono uzytkownika.");
    }

    return {
      user: this.toPublicUser(user),
    };
  }

  toPublicUser(user: User): PublicUser {
    const { passwordHash: _passwordHash, isActive: _isActive, ...publicUser } =
      user;

    return publicUser;
  }
}
