import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportDto } from './reports.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: ReportDto) {
    const data: any = { reporterId: userId, reason: dto.reason };
    if (dto.targetType === 'user') data.reportedUserId = dto.targetId;
    if (dto.targetType === 'quest') data.reportedQuestId = dto.targetId;
    if (dto.targetType === 'post') data.reportedPostId = dto.targetId;
    if (!data.reportedUserId && !data.reportedQuestId && !data.reportedPostId) {
      throw new BadRequestException('Invalid report target');
    }
    return this.prisma.report.create({ data });
  }
}