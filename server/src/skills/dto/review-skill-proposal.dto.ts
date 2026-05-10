import { SkillProposalStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class ReviewSkillProposalDto {
  @IsEnum(SkillProposalStatus)
  status!: SkillProposalStatus;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  reviewerComment?: string;
}
