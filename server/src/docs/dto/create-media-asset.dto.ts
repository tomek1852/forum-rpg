import { IsEnum, IsOptional, IsString, IsUUID, MinLength } from "class-validator";
import { MediaType } from "@prisma/client";

export class CreateMediaAssetDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  url!: string;

  @IsEnum(MediaType)
  type!: MediaType;

  @IsOptional()
  @IsUUID()
  worldId?: string;
}
