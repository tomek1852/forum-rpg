import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RankingsService } from "./rankings.service";

@Controller("rankings")
@UseGuards(JwtAuthGuard)
export class RankingsController {
  constructor(@Inject(RankingsService) private readonly rankingsService: RankingsService) {}

  @Get("worlds")
  getWorldRankings() {
    return this.rankingsService.getWorldRankings();
  }
}
