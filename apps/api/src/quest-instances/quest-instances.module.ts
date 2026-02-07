import { Module } from '@nestjs/common';
import { QuestInstancesController } from './quest-instances.controller';
import { QuestInstancesService } from './quest-instances.service';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  controllers: [QuestInstancesController],
  providers: [QuestInstancesService, NotificationsService],
})
export class QuestInstancesModule {}
