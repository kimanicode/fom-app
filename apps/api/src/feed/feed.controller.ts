import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { FeedService } from './feed.service';

@Controller('feed')
export class FeedController {
  constructor(private feed: FeedService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getFeed(
    @CurrentUser() user: { id: string },
    @Query('lat') lat?: string,
    @Query('lng') lng?: string
  ) {
    const latNum = lat ? Number(lat) : undefined;
    const lngNum = lng ? Number(lng) : undefined;
    return this.feed.getFeed(user.id, latNum, lngNum);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stories')
  getStories() {
    return this.feed.getStories();
  }
}
