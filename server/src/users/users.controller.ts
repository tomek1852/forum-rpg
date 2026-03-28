import { Body, Controller, Get, Inject, Param, Patch, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { UpdateProfileDto } from "./dto/update-profile.dto";
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

  @Get(":userId")
  getProfile(@Param("userId") userId: string) {
    return this.usersService.getProfileById(userId);
  }
}
