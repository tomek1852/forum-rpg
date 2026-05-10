import { Module } from "@nestjs/common";
import { RolesGuard } from "../common/guards/roles.guard";
import { WorldsController } from "./worlds.controller";
import { WorldsService } from "./worlds.service";

@Module({
  controllers: [WorldsController],
  providers: [WorldsService, RolesGuard],
  exports: [WorldsService],
})
export class WorldsModule {}
