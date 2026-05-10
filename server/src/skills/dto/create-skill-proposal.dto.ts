import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateSkillProposalDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  characterId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  mechanics?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  costs?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  limitations?: string;
}
