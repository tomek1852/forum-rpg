import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateEventParticipationDto {
  @IsUUID()
  characterId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
