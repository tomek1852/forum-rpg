import { IsArray, IsString, IsUUID, ArrayNotEmpty } from "class-validator";

export class CreateCombatDto {
  @IsString()
  title!: string;

  @IsUUID()
  worldId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  characterIds!: string[];
}
