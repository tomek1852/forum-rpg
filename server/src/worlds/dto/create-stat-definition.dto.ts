import { StatValueType } from "@prisma/client";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from "class-validator";

export class CreateStatDefinitionDto {
  @IsString()
  @MaxLength(40)
  @Matches(/^[a-z0-9_]+$/, {
    message: "Klucz statystyki moze zawierac tylko male litery, cyfry i podkreslenia.",
  })
  key!: string;

  @IsString()
  @MaxLength(60)
  label!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;

  @IsOptional()
  @IsEnum(StatValueType)
  valueType?: StatValueType;

  @IsOptional()
  @IsInt()
  minValue?: number;

  @IsOptional()
  @IsInt()
  maxValue?: number;

  @IsOptional()
  @IsInt()
  defaultNumericValue?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  defaultTextValue?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
