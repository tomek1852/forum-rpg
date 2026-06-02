import { Module } from "@nestjs/common";
import { RolesGuard } from "../common/guards/roles.guard";
import { IdeasController } from "./ideas.controller";
import { IdeasService } from "./ideas.service";

@Module({
  controllers: [IdeasController],
  providers: [IdeasService, RolesGuard],
  exports: [IdeasService],
})
export class IdeasModule {}
