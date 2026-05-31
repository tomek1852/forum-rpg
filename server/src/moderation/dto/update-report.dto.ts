import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { ModerationReportStatus } from "@prisma/client";

export class UpdateReportDto {
  @IsEnum(ModerationReportStatus)
  status!: ModerationReportStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolution?: string;
}
