import { IsEnum, IsOptional, IsString } from "class-validator";
import { IdeaStatus } from "@prisma/client";

export class UpdateIdeaStatusDto {
  @IsEnum(IdeaStatus)
  status!: IdeaStatus;

  @IsOptional()
  @IsString()
  gmNote?: string;
}
