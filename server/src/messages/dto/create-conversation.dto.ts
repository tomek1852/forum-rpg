import { IsString, IsUUID } from "class-validator";

export class CreateConversationDto {
  @IsString()
  @IsUUID()
  participantId!: string;
}
