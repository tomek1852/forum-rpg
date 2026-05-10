import { IsInt, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CharacterStatValueInputDto {
  @IsUUID()
  statDefinitionId!: string;

  @IsOptional()
  @IsInt()
  numericValue?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  textValue?: string;
}
