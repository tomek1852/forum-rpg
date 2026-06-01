import { Module } from "@nestjs/common";
import { ActivityLogModule } from "../activity-log/activity-log.module";
import { CharactersController } from "./characters.controller";
import { CharactersService } from "./characters.service";

@Module({
  imports: [ActivityLogModule],
  controllers: [CharactersController],
  providers: [CharactersService],
  exports: [CharactersService],
})
export class CharactersModule {}
