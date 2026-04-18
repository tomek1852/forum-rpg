import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { CharactersModule } from "./characters/characters.module";
import { ForumModule } from "./forum/forum.module";
import { MailerModule } from "./mailer/mailer.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    PrismaModule,
    MailerModule,
    UsersModule,
    CharactersModule,
    NotificationsModule,
    ForumModule,
    AuthModule,
  ],
})
export class AppModule {}
