import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { CharactersModule } from "./characters/characters.module";
import { EventsModule } from "./events/events.module";
import { ForumModule } from "./forum/forum.module";
import { MailerModule } from "./mailer/mailer.module";
import { MessagesModule } from "./messages/messages.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PresenceModule } from "./presence/presence.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SkillsModule } from "./skills/skills.module";
import { UsersModule } from "./users/users.module";
import { WorldsModule } from "./worlds/worlds.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    PrismaModule,
    MailerModule,
    MessagesModule,
    UsersModule,
    WorldsModule,
    CharactersModule,
    EventsModule,
    SkillsModule,
    NotificationsModule,
    PresenceModule,
    ForumModule,
    AuthModule,
  ],
})
export class AppModule {}
