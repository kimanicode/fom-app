import { IsUUID } from 'class-validator';

export class BlockDto {
  @IsUUID()
  blockedId!: string;
}