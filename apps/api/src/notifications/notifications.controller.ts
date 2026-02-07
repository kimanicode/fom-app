import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.notifications.list(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('read')
  markAllRead(@CurrentUser() user: { id: string }) {
    return this.notifications.markAllRead(user.id);
  }
}
