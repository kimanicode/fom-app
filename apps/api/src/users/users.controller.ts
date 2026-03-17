import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { RequestWithdrawalDto, UpdateProfileDto } from './users.dto';
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
  @Get('users/me/created')
  getCreated(@CurrentUser() user: { id: string }) {
    return this.users.listCreated(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/me/wallet')
  getWallet(@CurrentUser() user: { id: string }) {
    return this.users.getWallet(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('users/me/withdrawals')
  requestWithdrawal(@CurrentUser() user: { id: string }, @Body() dto: RequestWithdrawalDto) {
    return this.users.requestWithdrawal(user.id, dto);
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
