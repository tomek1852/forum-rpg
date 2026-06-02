import { IsOptional, IsString, MinLength } from "class-validator";

export class CreateIdeaDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(10)
  content!: string;

  @IsOptional()
  @IsString()
  category?: string;
}
