import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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

  @IsEnum(['chill', 'active', 'creative', 'curious'])
  vibeTag!: string;

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
}

export class RedoQuestDto {
  @IsDateString()
  startTime!: string;
}
