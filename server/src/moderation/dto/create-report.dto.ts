import { IsEnum, IsString, IsUUID, MaxLength, MinLength } from "class-validator";
import { ModerationReportTargetType } from "@prisma/client";

export class CreateReportDto {
  @IsEnum(ModerationReportTargetType)
  targetType!: ModerationReportTargetType;

  @IsUUID()
  targetId!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason!: string;
}
