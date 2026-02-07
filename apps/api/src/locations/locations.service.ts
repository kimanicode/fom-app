import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async getLocation(id: string) {
    const location = await this.prisma.location.findUnique({
      where: { id },
      include: {
        quests: true,
        posts: { include: { user: true } },
      },
    });
    if (!location) throw new NotFoundException('Location not found');
    return location;
  }
}