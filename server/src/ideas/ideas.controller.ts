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
import { IdeaStatus, UserRole } from "@prisma/client";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CreateIdeaDto } from "./dto/create-idea.dto";
import { UpdateIdeaStatusDto } from "./dto/update-idea-status.dto";
import { IdeasService } from "./ideas.service";

@Controller("ideas")
@UseGuards(JwtAuthGuard)
export class IdeasController {
  constructor(@Inject(IdeasService) private readonly ideasService: IdeasService) {}

  @Post()
  createIdea(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateIdeaDto,
  ) {
    return this.ideasService.createIdea(user.userId, dto);
  }

  @Get()
  listIdeas(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Query("status") status?: IdeaStatus,
  ) {
    return this.ideasService.listIdeas(user.userId, user.role, status);
  }

  @Patch(":id/status")
  @UseGuards(RolesGuard)
  @Roles("GM", "ADMIN")
  updateIdeaStatus(
    @Param("id") id: string,
    @Body() dto: UpdateIdeaStatusDto,
  ) {
    return this.ideasService.updateIdeaStatus(id, dto);
  }
}
