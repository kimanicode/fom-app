import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHealth() {
    const database = await this.prisma.checkHealth();

    return {
      status: 'ok',
      service: 'fom-api',
      timestamp: new Date().toISOString(),
      database,
    };
  }
}
