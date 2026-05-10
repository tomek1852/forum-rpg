import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MailerModule } from "../mailer/mailer.module";
import { PrismaModule } from "../prisma/prisma.module";
import { NotificationsController } from "./notifications.controller";
import { NotificationsGateway } from "./notifications.gateway";
import { NotificationsRealtimeService } from "./notifications-realtime.service";
import { NotificationsService } from "./notifications.service";

@Module({
  imports: [MailerModule, PrismaModule, JwtModule.register({})],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    NotificationsRealtimeService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
