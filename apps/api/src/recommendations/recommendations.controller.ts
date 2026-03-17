import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { RecommendationSignalDto } from './recommendations.dto';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendations: RecommendationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('events')
  getRecommendations(
    @CurrentUser() user: { id: string },
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('take') take?: string,
  ) {
    const latNum = lat ? Number(lat) : undefined;
    const lngNum = lng ? Number(lng) : undefined;
    const takeNum = take ? Number(take) : undefined;
    return this.recommendations.getRecommendedQuests(user.id, latNum, lngNum, takeNum);
  }

  @UseGuards(JwtAuthGuard)
  @Post('events/:id/signals')
  trackSignal(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: RecommendationSignalDto,
  ) {
    return this.recommendations.trackBehavior(user.id, id, dto.signalType, dto.strength, dto.context);
  }
}
