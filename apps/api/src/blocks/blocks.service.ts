import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockDto } from './blocks.dto';

@Injectable()
export class BlocksService {
  constructor(private prisma: PrismaService) {}

  async block(userId: string, dto: BlockDto) {
    await this.prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: dto.blockedId } },
      update: {},
      create: { blockerId: userId, blockedId: dto.blockedId },
    });
    return { ok: true };
  }
}