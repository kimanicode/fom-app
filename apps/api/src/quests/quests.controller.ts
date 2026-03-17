import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { CreateQuestDto, JoinQuestDto } from './quests.dto';
import { QuestsService } from './quests.service';

@Controller('quests')
export class QuestsController {
  constructor(private quests: QuestsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateQuestDto) {
    return this.quests.create(user.id, dto);
  }

  @Get()
  list(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radiusKm') radiusKm?: string
  ) {
    const latNum = lat ? Number(lat) : undefined;
    const lngNum = lng ? Number(lng) : undefined;
    const radiusNum = radiusKm ? Number(radiusKm) : undefined;
    return this.quests.list(latNum, lngNum, radiusNum);
  }

  @UseGuards(JwtAuthGuard)
  @Get('recommendations')
  recommend(
    @CurrentUser() user: { id: string },
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('take') take?: string
  ) {
    const latParsed = lat ? Number(lat) : undefined;
    const lngParsed = lng ? Number(lng) : undefined;
    const takeParsed = take ? Number(take) : undefined;
    const latNum = Number.isFinite(latParsed) ? latParsed : undefined;
    const lngNum = Number.isFinite(lngParsed) ? lngParsed : undefined;
    const takeNum = Number.isFinite(takeParsed) ? takeParsed : undefined;
    return this.quests.recommend(user.id, latNum, lngNum, takeNum);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.quests.getById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  join(@Param('id') id: string, @CurrentUser() user: { id: string }, @Body() dto: JoinQuestDto) {
    return this.quests.join(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/save')
  save(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.quests.save(id, user.id);
  }
}
