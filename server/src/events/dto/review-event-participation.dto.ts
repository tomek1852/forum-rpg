import { EventParticipationStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class ReviewEventParticipationDto {
  @IsEnum(EventParticipationStatus)
  status!: EventParticipationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  reviewerComment?: string;
}
