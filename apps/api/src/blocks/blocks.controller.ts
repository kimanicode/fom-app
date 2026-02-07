import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { BlockDto } from './blocks.dto';
import { BlocksService } from './blocks.service';

@Controller('blocks')
export class BlocksController {
  constructor(private blocks: BlocksService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  block(@CurrentUser() user: { id: string }, @Body() dto: BlockDto) {
    return this.blocks.block(user.id, dto);
  }
}