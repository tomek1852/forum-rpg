import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "../prisma/prisma.module";
import { MessagesController } from "./messages.controller";
import { MessagesGateway } from "./messages.gateway";
import { MessagesRealtimeService } from "./messages-realtime.service";
import { MessagesService } from "./messages.service";

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway, MessagesRealtimeService],
  exports: [MessagesService],
})
export class MessagesModule {}
