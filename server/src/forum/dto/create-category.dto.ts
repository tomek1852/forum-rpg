import { IsInt, IsOptional, IsString, Matches, MaxLength, Min } from "class-validator";

export class CreateCategoryDto {
  @IsString()
  @MaxLength(80)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#(?:[0-9a-fA-F]{6})$/, {
    message: "Kolor musi byc zapisany jako pelny hex, np. #9d3d2d.",
  })
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
