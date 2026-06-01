import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { BadgesService } from "./badges.service";
import { AwardBadgeDto } from "./dto/award-badge.dto";
import { CreateBadgeDto } from "./dto/create-badge.dto";

@Controller()
@UseGuards(JwtAuthGuard)
export class BadgesController {
  constructor(
    @Inject(BadgesService) private readonly badgesService: BadgesService,
  ) {}

  @Get("badges")
  listAll() {
    return this.badgesService.listAll();
  }

  @Get("characters/:characterId/badges")
  listForCharacter(@Param("characterId") characterId: string) {
    return this.badgesService.listForCharacter(characterId);
  }

  @Post("admin/badges")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  createBadge(@Body() dto: CreateBadgeDto) {
    return this.badgesService.createBadge(dto);
  }

  @Post("characters/:characterId/badges")
  @UseGuards(RolesGuard)
  @Roles("GM", "ADMIN")
  awardBadge(
    @Param("characterId") characterId: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: AwardBadgeDto,
  ) {
    return this.badgesService.awardBadge(characterId, user.userId, dto);
  }

  @Delete("characters/:characterId/badges/:badgeId")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  removeBadge(
    @Param("characterId") characterId: string,
    @Param("badgeId") badgeId: string,
  ) {
    return this.badgesService.removeBadge(characterId, badgeId);
  }
}
