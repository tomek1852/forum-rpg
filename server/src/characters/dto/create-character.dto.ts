import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { CharacterStatValueInputDto } from "./character-stat-value-input.dto";

export class CreateCharacterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name!: string;

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

  @IsUUID()
  worldId!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CharacterStatValueInputDto)
  statValues?: CharacterStatValueInputDto[];

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
