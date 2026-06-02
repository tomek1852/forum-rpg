import { IsArray, IsInt, IsUUID, ArrayNotEmpty, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class InitiativeEntryDto {
  @IsUUID()
  characterId!: string;

  @IsInt()
  initiative!: number;
}

export class SetInitiativeDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => InitiativeEntryDto)
  entries!: InitiativeEntryDto[];
}
