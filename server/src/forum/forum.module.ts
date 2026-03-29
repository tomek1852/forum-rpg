import { Module } from "@nestjs/common";
import { RolesGuard } from "../common/guards/roles.guard";
import { ForumController } from "./forum.controller";
import { ForumService } from "./forum.service";

@Module({
  controllers: [ForumController],
  providers: [ForumService, RolesGuard],
  exports: [ForumService],
})
export class ForumModule {}
