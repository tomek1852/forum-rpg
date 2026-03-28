import { Body, Controller, Get, Inject, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CharactersService } from "./characters.service";
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

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateCharacterDto,
  ) {
    return this.charactersService.create(user.userId, dto);
  }

  @Get(":characterId")
  getById(
    @Param("characterId") characterId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.charactersService.getById(characterId, user.userId);
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
