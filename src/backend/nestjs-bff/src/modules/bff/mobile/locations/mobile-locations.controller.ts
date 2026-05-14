import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../guards/jwt-auth.guard';
import { Public } from '../../../../decorators/public.decorator';
import { ParkingLotService } from '../../../domain/parking-lot/parking-lot.service';
import { PartnerService } from '../../../domain/partner/partner.service';

/**
 * Mobile BFF — Locations controller
 * Prefix: /pakipark/mobile
 *
 * CONTRACT:
 *   GET    /pakipark/mobile/locations                        [public]
 *   GET    /pakipark/mobile/locations/:locationId            [public]
 *   GET    /pakipark/mobile/locations/:locationId/slots      [public]
 *   GET    /pakipark/mobile/locations/:locationId/rates      [public]
 *   GET    /pakipark/mobile/locations/:locationId/reviews    [public]
 */
@UseGuards(JwtAuthGuard)
@Controller('pakipark/mobile')
export class MobileLocationsController {
  constructor(
    private readonly parkingLot: ParkingLotService,
    private readonly partner: PartnerService,
  ) {}

  @Get('locations')
  @Public()
  searchLocations(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radiusKm') radiusKm = 5,
    @Query('date') date: string,
  ) {
    return this.parkingLot.searchLocations({ lat: +lat, lng: +lng, radiusKm: +radiusKm, date });
  }

  @Get('locations/:locationId')
  @Public()
  getLocation(@Param('locationId') locationId: string) {
    return this.parkingLot.getLocationDetail(locationId);
  }

  @Get('locations/:locationId/slots')
  @Public()
  getSlots(
    @Param('locationId') locationId: string,
    @Query('date') date: string,
    @Query('timeSlot') timeSlot: string,
  ) {
    return this.parkingLot.getAvailableSlots(locationId, date, timeSlot);
  }

  @Get('locations/:locationId/rates')
  @Public()
  getRates(@Param('locationId') locationId: string) {
    return this.parkingLot.getRates(locationId);
  }

  @Get('locations/:locationId/reviews')
  @Public()
  getReviews(
    @Param('locationId') locationId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.partner.getLocationReviews(locationId, { page: +page, limit: +limit });
  }
}
