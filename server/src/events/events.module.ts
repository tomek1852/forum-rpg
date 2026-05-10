import { Module } from "@nestjs/common";
import { RolesGuard } from "../common/guards/roles.guard";
import { PrismaModule } from "../prisma/prisma.module";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";

@Module({
  imports: [PrismaModule],
  controllers: [EventsController],
  providers: [EventsService, RolesGuard],
})
export class EventsModule {}
