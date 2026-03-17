import { IsArray, ArrayNotEmpty, IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';

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

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  interests!: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  selectedCategoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  selectedSubcategoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  selectedInterestIds?: string[];

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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  intentTags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vibePreferences?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  audienceAffinities?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  locationPreferences?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  timePreferences?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pricePreferences?: string[];
}

export class RequestWithdrawalDto {
  @IsInt()
  @Min(10000)
  amountCents!: number;

  @IsString()
  @MaxLength(120)
  destination!: string;
}
