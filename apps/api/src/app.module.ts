import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { QuestsModule } from './quests/quests.module';
import { QuestInstancesModule } from './quest-instances/quest-instances.module';
import { FeedModule } from './feed/feed.module';
import { LocationsModule } from './locations/locations.module';
import { ReportsModule } from './reports/reports.module';
import { BlocksModule } from './blocks/blocks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MediaModule } from './media/media.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    QuestsModule,
    QuestInstancesModule,
    FeedModule,
    LocationsModule,
    ReportsModule,
    BlocksModule,
    NotificationsModule,
    MediaModule,
    ChatModule,
  ],
})
export class AppModule {}
