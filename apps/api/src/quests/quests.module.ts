import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { QuestsController } from './quests.controller';
import { QuestEnrichmentService } from './quest-enrichment.service';
import { QuestsService } from './quests.service';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  imports: [AuthModule],
  controllers: [QuestsController],
  providers: [QuestsService, NotificationsService, QuestEnrichmentService],
})
export class QuestsModule {}
