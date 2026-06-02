import { Module } from "@nestjs/common";
import { RolesGuard } from "../common/guards/roles.guard";
import { DocsController } from "./docs.controller";
import { DocsService } from "./docs.service";

@Module({
  controllers: [DocsController],
  providers: [DocsService, RolesGuard],
  exports: [DocsService],
})
export class DocsModule {}
