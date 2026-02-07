import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private media: MediaService) {}

  @UseGuards(JwtAuthGuard)
  @Post('sign')
  sign(@Body() body: { folder?: string }) {
    return this.media.signUpload({ folder: body?.folder });
  }
}
