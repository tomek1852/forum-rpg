import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class UpdateDocCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  worldId?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
