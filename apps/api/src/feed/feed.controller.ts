import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/user.decorator';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { FeedService } from './feed.service';

@Controller('feed')
export class FeedController {
  constructor(private feed: FeedService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  getFeed(
    @CurrentUser() user: { id: string } | null,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string
  ) {
    const latNum = lat ? Number(lat) : undefined;
    const lngNum = lng ? Number(lng) : undefined;
    return this.feed.getFeed(user?.id, latNum, lngNum);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('stories')
  getStories() {
    return this.feed.getStories();
  }
}
