import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { ChatService } from './chat.service';

@Controller('quest-instances')
export class ChatController {
  constructor(private chat: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id/chat')
  list(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.chat.listMessages(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/chat')
  send(@Param('id') id: string, @CurrentUser() user: { id: string }, @Body() body: { text: string }) {
    return this.chat.sendMessage(id, user.id, body.text);
  }
}
