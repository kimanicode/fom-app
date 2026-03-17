import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsArray, IsUUID } from 'class-validator';

export class LocationInputDto {
  @IsString()
  @MaxLength(120)
  placeName!: string;

  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  category?: string;
}

export class CreateQuestDto {
  @IsString()
  @MaxLength(80)
  title!: string;

  @IsString()
  @MaxLength(600)
  description!: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @IsOptional()
  @IsUUID('4')
  subcategoryId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  interestIds?: string[];

  @IsEnum(['chill', 'active', 'creative', 'curious'])
  vibeTag!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  intentTags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vibeTags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  audienceTags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  locationTags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  timeTags?: string[];

  @IsOptional()
  @IsString()
  priceTag?: string;

  @ValidateNested()
  @Type(() => LocationInputDto)
  location!: LocationInputDto;

  @IsDateString()
  startTime!: string;

  @IsInt()
  @Min(15)
  durationMinutes!: number;

  @IsInt()
  @Min(1)
  maxParticipants!: number;

  @IsOptional()
  @IsEnum(['free', 'paid'])
  costType?: 'free' | 'paid';

  @IsOptional()
  @IsInt()
  @Min(0)
  costAmountCents?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;
}

export class JoinQuestDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  paymentMethod?: string;
}
