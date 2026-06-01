import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from "class-validator";

enum UserRoleEnum {
  PLAYER = "PLAYER",
  GM = "GM",
  ADMIN = "ADMIN",
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string;

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
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(UserRoleEnum, { each: true })
  allowedRoles?: string[];

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
