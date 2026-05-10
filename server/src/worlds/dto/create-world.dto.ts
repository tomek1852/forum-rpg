import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateWorldDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^[a-z0-9-]+$/, {
    message: "Slug moze zawierac tylko male litery, cyfry i myslniki.",
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;
}
