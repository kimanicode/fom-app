import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { CheckinDto, CompleteDto, PostCreateDto, RatingDto } from './quest-instances.dto';
import { QuestInstancesService } from './quest-instances.service';

@Controller('quest-instances')
export class QuestInstancesController {
  constructor(private instances: QuestInstancesService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id/checkin')
  checkin(@Param('id') id: string, @CurrentUser() user: { id: string }, @Body() dto: CheckinDto) {
    return this.instances.checkin(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/complete')
  complete(@Param('id') id: string, @CurrentUser() user: { id: string }, @Body() dto: CompleteDto) {
    return this.instances.complete(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/posts')
  createPost(@Param('id') id: string, @CurrentUser() user: { id: string }, @Body() dto: PostCreateDto) {
    return this.instances.createPost(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/rate')
  rate(@Param('id') id: string, @CurrentUser() user: { id: string }, @Body() dto: RatingDto) {
    return this.instances.rate(id, user.id, dto);
  }
}