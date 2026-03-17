import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  imports: [AuthModule],
})
export class ChatModule {}
