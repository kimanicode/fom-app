import { IsEnum, IsNumber, IsObject, IsOptional } from 'class-validator';

export class RecommendationSignalDto {
  @IsEnum(['viewed', 'saved', 'joined', 'paid', 'dismissed'])
  signalType!: 'viewed' | 'saved' | 'joined' | 'paid' | 'dismissed';

  @IsOptional()
  @IsNumber()
  strength?: number;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}
