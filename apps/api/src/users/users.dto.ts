import { IsArray, ArrayNotEmpty, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55+'] as const;

export class UpdateProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  name!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  alias?: string;

  @IsString()
  @IsIn(AGE_RANGES)
  ageRange!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  interests!: string[];

  @IsString()
  @MinLength(2)
  @MaxLength(64)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  bio?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
