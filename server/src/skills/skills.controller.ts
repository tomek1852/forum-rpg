import { Body, Controller, Get, Inject, Patch, Post, Param, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CreateSkillProposalDto } from "./dto/create-skill-proposal.dto";
import { ReviewSkillProposalDto } from "./dto/review-skill-proposal.dto";
import { SkillsService } from "./skills.service";

@Controller("skills")
@UseGuards(JwtAuthGuard)
export class SkillsController {
  constructor(@Inject(SkillsService) private readonly skillsService: SkillsService) {}

  @Post("proposals")
  createProposal(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateSkillProposalDto,
  ) {
    return this.skillsService.createProposal(user.userId, dto);
  }

  @Get("proposals/review")
  @UseGuards(RolesGuard)
  @Roles("GM", "ADMIN")
  listReviewQueue() {
    return this.skillsService.listReviewQueue();
  }

  @Patch("proposals/:proposalId/review")
  @UseGuards(RolesGuard)
  @Roles("GM", "ADMIN")
  reviewProposal(
    @Param("proposalId") proposalId: string,
    @CurrentUser() user: { userId: string; role: string },
    @Body() dto: ReviewSkillProposalDto,
  ) {
    return this.skillsService.reviewProposal(proposalId, user, dto);
  }
}
