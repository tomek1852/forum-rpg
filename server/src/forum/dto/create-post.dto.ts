import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreatePostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  quotePostId?: string;
}
