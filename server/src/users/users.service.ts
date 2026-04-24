import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AccountStatus, Prisma, User, UserRole } from "@prisma/client";
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

  async listModerationAccounts() {
    const users = await this.prisma.user.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    return {
      users: users.map((user) => this.toPublicUser(user)),
    };
  }

  async updateAccountStatus(
    userId: string,
    status: AccountStatus,
    actor: { userId: string; role: string },
  ) {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException("Nie znaleziono uzytkownika.");
    }

    if (status === AccountStatus.ACTIVE && !user.emailVerified) {
      throw new BadRequestException(
        "Nie mozna aktywowac konta bez zweryfikowanego adresu e-mail.",
      );
    }

    if (actor.role !== UserRole.ADMIN && user.role === UserRole.ADMIN) {
      throw new ForbiddenException(
        "Tylko administrator moze zmieniac status kont administratorow.",
      );
    }

    if (actor.userId === user.id && status === AccountStatus.BLOCKED) {
      throw new BadRequestException("Nie mozna zablokowac wlasnego konta.");
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    return {
      message: "Status konta zostal zaktualizowany.",
      user: this.toPublicUser(updatedUser),
    };
  }

  async updateUserRole(
    userId: string,
    role: UserRole,
    actor: { userId: string; role: string },
  ) {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException("Nie znaleziono uzytkownika.");
    }

    if (actor.userId === user.id && role !== UserRole.ADMIN) {
      throw new BadRequestException(
        "Nie mozna odebrac sobie roli administratora w tym panelu.",
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return {
      message: "Rola uzytkownika zostala zaktualizowana.",
      user: this.toPublicUser(updatedUser),
    };
  }

  toPublicUser(user: User): PublicUser {
    const { passwordHash: _passwordHash, isActive: _isActive, ...publicUser } =
      user;

    return publicUser;
  }
}
