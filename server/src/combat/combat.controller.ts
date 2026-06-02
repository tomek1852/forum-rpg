import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CombatService } from "./combat.service";
import { CreateCombatDto } from "./dto/create-combat.dto";
import { SetInitiativeDto } from "./dto/set-initiative.dto";
import { ListCombatQueryDto } from "./dto/list-combat-query.dto";

@Controller("combat")
@UseGuards(JwtAuthGuard)
export class CombatController {
  constructor(@Inject(CombatService) private readonly combatService: CombatService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.GM, UserRole.ADMIN)
  create(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Body() dto: CreateCombatDto,
  ) {
    return this.combatService.create(user.userId, dto);
  }

  @Post(":id/initiative")
  @UseGuards(RolesGuard)
  @Roles(UserRole.GM, UserRole.ADMIN)
  setInitiative(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Param("id") id: string,
    @Body() dto: SetInitiativeDto,
  ) {
    return this.combatService.setInitiative(user.userId, id, dto);
  }

  @Post(":id/start")
  @UseGuards(RolesGuard)
  @Roles(UserRole.GM, UserRole.ADMIN)
  start(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Param("id") id: string,
  ) {
    return this.combatService.start(user.userId, id);
  }

  @Get()
  list(@Query() query: ListCombatQueryDto) {
    return this.combatService.list(query);
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.combatService.getById(id);
  }
}
