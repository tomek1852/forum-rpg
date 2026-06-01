import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class AwardBadgeDto {
  @IsUUID()
  badgeId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  note?: string;
}
