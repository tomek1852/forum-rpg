import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class AddProgressDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expDelta?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  phDelta?: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  ruleId?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
