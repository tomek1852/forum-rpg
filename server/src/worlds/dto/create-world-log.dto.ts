import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateWorldLogDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;
}
