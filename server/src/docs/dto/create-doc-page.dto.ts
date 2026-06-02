import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class CreateDocPageDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsString()
  content!: string;

  @IsUUID()
  categoryId!: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
