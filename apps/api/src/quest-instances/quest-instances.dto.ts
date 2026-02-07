import { IsInt, IsNumber, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';

export class CheckinDto {
  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;
}

export class CompleteDto {
  @IsOptional()
  @IsString()
  timestamp?: string;
}

export class PostCreateDto {
  @IsUrl()
  mediaUrl!: string;

  @IsString()
  mediaType!: 'photo' | 'video';

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(60)
  durationSeconds?: number;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  caption?: string;
}

export class RatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  comment?: string;
}