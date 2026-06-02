import { IsOptional, IsString, IsEnum } from "class-validator";
import { CombatStatus } from "@prisma/client";

export class ListCombatQueryDto {
  @IsOptional()
  @IsString()
  worldId?: string;

  @IsOptional()
  @IsEnum(CombatStatus)
  status?: CombatStatus;
}
