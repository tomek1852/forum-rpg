import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "../prisma/prisma.module";
import { PresenceGateway } from "./presence.gateway";

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  providers: [PresenceGateway],
})
export class PresenceModule {}
