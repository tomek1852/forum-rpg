import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CharactersService } from "./characters.service";
import { AddProgressDto } from "./dto/add-progress.dto";
import { CharacterRankingQueryDto } from "./dto/character-ranking-query.dto";
import { CreateCharacterDto } from "./dto/create-character.dto";
import { UpdateCharacterDto } from "./dto/update-character.dto";

@Controller("characters")
@UseGuards(JwtAuthGuard)
export class CharactersController {
  constructor(
    @Inject(CharactersService)
    private readonly charactersService: CharactersService,
  ) {}

  @Get("my")
  listMine(@CurrentUser() user: { userId: string }) {
    return this.charactersService.listMine(user.userId);
  }

  @Get("user/:userId")
  listByUser(@Param("userId") userId: string) {
    return this.charactersService.listByOwner(userId);
  }

  @Get("rankings")
  listRankings(@Query() query: CharacterRankingQueryDto) {
    return this.charactersService.listRankings(query);
  }

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateCharacterDto,
  ) {
    return this.charactersService.create(user.userId, dto);
  }

  @Get(":characterId/rank")
  getCharacterRank(@Param("characterId") characterId: string) {
    return this.charactersService.getCharacterRank(characterId);
  }

  @Get(":characterId")
  getById(
    @Param("characterId") characterId: string,
    @CurrentUser() user: { userId: string; role?: string },
  ) {
    return this.charactersService.getById(characterId, user.userId, user.role);
  }

  @Get(":characterId/progress")
  listProgressHistory(
    @Param("characterId") characterId: string,
    @CurrentUser() user: { userId: string; role?: string },
  ) {
    return this.charactersService.listProgressHistory(characterId, user);
  }

  @Post(":characterId/progress")
  @UseGuards(RolesGuard)
  @Roles("GM", "ADMIN")
  grantProgress(
    @Param("characterId") characterId: string,
    @CurrentUser() user: { userId: string; role?: string },
    @Body() dto: AddProgressDto,
  ) {
    return this.charactersService.grantProgress(characterId, user, dto);
  }

  @Patch(":characterId")
  update(
    @Param("characterId") characterId: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateCharacterDto,
  ) {
    return this.charactersService.update(characterId, user.userId, dto);
  }
}
