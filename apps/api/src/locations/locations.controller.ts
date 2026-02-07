import { Controller, Get, Param } from '@nestjs/common';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private locations: LocationsService) {}

  @Get(':id')
  getLocation(@Param('id') id: string) {
    return this.locations.getLocation(id);
  }
}