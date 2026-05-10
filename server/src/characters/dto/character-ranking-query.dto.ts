import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CharacterRankingQueryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  worldId?: string;
}
