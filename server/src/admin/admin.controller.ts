import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AccountStatus, UserRole } from "@prisma/client";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { UpdateAccountStatusDto } from "../users/dto/update-account-status.dto";
import { UpdateUserRoleDto } from "../users/dto/update-user-role.dto";
import { UsersService } from "../users/users.service";
import { AdminService } from "./admin.service";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminController {
  constructor(
    @Inject(AdminService) private readonly adminService: AdminService,
    @Inject(UsersService) private readonly usersService: UsersService,
  ) {}

  @Get("users")
  listUsers(
    @Query("search") search?: string,
    @Query("role") role?: string,
    @Query("status") status?: string,
    @Query("sortBy") sortBy?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.adminService.listUsers({
      search,
      role: role as UserRole | undefined,
      status: status as AccountStatus | undefined,
      sortBy: sortBy as "createdAt" | "lastLogin" | "username" | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get("users/:userId/activity")
  getUserActivity(@Param("userId") userId: string) {
    return this.adminService.getUserActivity(userId);
  }

  @Patch("users/:userId/status")
  updateUserStatus(
    @CurrentUser() actor: AuthenticatedUser,
    @Param("userId") userId: string,
    @Body() dto: UpdateAccountStatusDto,
  ) {
    return this.usersService.updateAccountStatus(userId, dto.status, actor);
  }

  @Patch("users/:userId/role")
  updateUserRole(
    @CurrentUser() actor: AuthenticatedUser,
    @Param("userId") userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateUserRole(userId, dto.role, actor);
  }

  @Get("stats")
  getStats() {
    return this.adminService.getStats();
  }
}
