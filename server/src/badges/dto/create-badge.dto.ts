import { BadgeCondition } from "@prisma/client";
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateBadgeDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsString()
  @MaxLength(400)
  description!: string;

  @IsString()
  @MaxLength(100)
  icon!: string;

  @IsEnum(BadgeCondition)
  condition!: BadgeCondition;

  @IsOptional()
  @IsInt()
  @Min(1)
  threshold?: number;
}
