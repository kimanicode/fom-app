import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    const maxRetries = Number(process.env.PRISMA_CONNECT_RETRIES ?? 5);
    const retryDelayMs = Number(process.env.PRISMA_CONNECT_RETRY_DELAY_MS ?? 3000);
    const runtimeTarget = this.describeConnectionTarget(process.env.DATABASE_URL);
    const directTarget = this.describeConnectionTarget(process.env.DIRECT_URL);

    this.logger.log(`Prisma runtime target: ${runtimeTarget}`);
    this.logger.log(`Prisma direct target: ${directTarget}`);

    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      try {
        await this.$connect();
        await this.$queryRaw`SELECT 1`;
        if (attempt > 1) {
          this.logger.log(`Prisma connected on attempt ${attempt}/${maxRetries}`);
        }
        return;
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const message = error instanceof Error ? error.message : String(error);

        if (isLastAttempt) {
          this.logger.error(`Prisma failed to connect after ${maxRetries} attempts`, message);
          throw error;
        }

        this.logger.warn(
          `Prisma connect attempt ${attempt}/${maxRetries} failed. Retrying in ${retryDelayMs}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async checkHealth() {
    const startedAt = Date.now();
    await this.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      latencyMs: Date.now() - startedAt,
      runtimeTarget: this.describeConnectionTarget(process.env.DATABASE_URL),
      directTarget: this.describeConnectionTarget(process.env.DIRECT_URL),
    };
  }

  private describeConnectionTarget(connectionString?: string) {
    if (!connectionString) {
      return 'not_configured';
    }

    try {
      const url = new URL(connectionString);
      const search = url.searchParams;
      const mode = search.get('pgbouncer') === 'true'
        ? 'pooled'
        : url.hostname.includes('pooler.supabase.com')
          ? 'session_pooler'
          : 'direct';
      const database = url.pathname.replace(/^\//, '') || 'unknown';
      const ssl = search.get('sslmode') || 'default';
      return `${url.hostname}:${url.port || '5432'}/${database} (${mode}, ssl=${ssl})`;
    } catch {
      return 'invalid_connection_string';
    }
  }
}
