import { Module } from '@nestjs/common';
import { QuestsController } from './quests.controller';
import { QuestsService } from './quests.service';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  controllers: [QuestsController],
  providers: [QuestsService, NotificationsService],
})
export class QuestsModule {}
