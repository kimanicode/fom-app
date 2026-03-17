import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { QuestInstancesController } from './quest-instances.controller';
import { QuestInstancesService } from './quest-instances.service';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  imports: [AuthModule],
  controllers: [QuestInstancesController],
  providers: [QuestInstancesService, NotificationsService],
})
export class QuestInstancesModule {}
