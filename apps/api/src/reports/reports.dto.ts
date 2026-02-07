import { IsEnum, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class ReportDto {
  @IsEnum(['user', 'quest', 'post'])
  targetType!: 'user' | 'quest' | 'post';

  @IsUUID()
  targetId!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(240)
  reason!: string;
}