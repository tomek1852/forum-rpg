import { IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreateThreadDto {
  @IsString()
  @IsUUID()
  categoryId!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(10000)
  content!: string;
}
