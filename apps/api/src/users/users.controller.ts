import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { UpdateProfileDto } from './users.dto';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('interests')
  listInterests() {
    return this.users.listInterests();
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/me')
  getMe(@CurrentUser() user: { id: string }) {
    return this.users.getMe(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/me/saves')
  getSaved(@CurrentUser() user: { id: string }) {
    return this.users.listSaved(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/me/joined')
  getJoined(@CurrentUser() user: { id: string }) {
    return this.users.listJoined(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('users/me')
  createProfile(@CurrentUser() user: { id: string }, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('users/me')
  updateProfile(@CurrentUser() user: { id: string }, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }
}
