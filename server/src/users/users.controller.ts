import { Body, Controller, Get, Inject, Param, Patch, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { UpdateAccountStatusDto } from "./dto/update-account-status.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpdateUserRoleDto } from "./dto/update-user-role.dto";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get("me")
  me(@CurrentUser() user: { userId: string }) {
    return this.usersService.getProfileById(user.userId);
  }

  @Patch("me")
  updateMe(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.userId, dto);
  }

  @Get("moderation/accounts")
  @Roles("GM", "ADMIN")
  @UseGuards(RolesGuard)
  getModerationAccounts() {
    return this.usersService.listModerationAccounts();
  }

  @Patch("moderation/accounts/:userId/status")
  @Roles("GM", "ADMIN")
  @UseGuards(RolesGuard)
  updateAccountStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param("userId") userId: string,
    @Body() dto: UpdateAccountStatusDto,
  ) {
    return this.usersService.updateAccountStatus(userId, dto.status, user);
  }

  @Patch("moderation/accounts/:userId/role")
  @Roles("ADMIN")
  @UseGuards(RolesGuard)
  updateUserRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param("userId") userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateUserRole(userId, dto.role, user);
  }

  @Get(":userId")
  getProfile(@Param("userId") userId: string) {
    return this.usersService.getProfileById(userId);
  }
}
