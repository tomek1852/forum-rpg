import { Body, Controller, Get, Inject, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { CreateWorldLogDto } from "./dto/create-world-log.dto";
import { Roles } from "../common/decorators/roles.decorator";
import { CreateStatDefinitionDto } from "./dto/create-stat-definition.dto";
import { CreateWorldDto } from "./dto/create-world.dto";
import { WorldsService } from "./worlds.service";

@Controller("worlds")
@UseGuards(JwtAuthGuard)
export class WorldsController {
  constructor(@Inject(WorldsService) private readonly worldsService: WorldsService) {}

  @Get()
  listWorlds() {
    return this.worldsService.listWorlds();
  }

  @Get(":worldId/world-log")
  listWorldLogs(@Param("worldId") worldId: string) {
    return this.worldsService.listWorldLogs(worldId);
  }

  @Get(":worldId")
  getWorld(@Param("worldId") worldId: string) {
    return this.worldsService.getWorld(worldId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles("GM", "ADMIN")
  createWorld(@Body() dto: CreateWorldDto) {
    return this.worldsService.createWorld(dto);
  }

  @Post(":worldId/world-log")
  @UseGuards(RolesGuard)
  @Roles("GM", "ADMIN")
  createWorldLog(
    @Param("worldId") worldId: string,
    @CurrentUser() user: { userId: string; role?: string },
    @Body() dto: CreateWorldLogDto,
  ) {
    return this.worldsService.createWorldLog(worldId, user.userId, user.role, dto);
  }

  @Post(":worldId/stats")
  @UseGuards(RolesGuard)
  @Roles("GM", "ADMIN")
  createStatDefinition(
    @Param("worldId") worldId: string,
    @Body() dto: CreateStatDefinitionDto,
  ) {
    return this.worldsService.createStatDefinition(worldId, dto);
  }
}
