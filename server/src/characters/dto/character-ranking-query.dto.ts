import { Type } from "class-transformer";
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from "class-validator";

export class CharacterRankingQueryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  worldId?: string;

  @IsOptional()
  @IsIn(["exp", "heroPoints", "skillsCount", "createdAt"])
  sortBy?: "exp" | "heroPoints" | "skillsCount" | "createdAt";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cursor?: string;
}
