import { IsBoolean, IsObject, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateCharacterDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  biography?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  appearance?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @IsOptional()
  @IsObject()
  statsJson?: Record<string, number | string>;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
