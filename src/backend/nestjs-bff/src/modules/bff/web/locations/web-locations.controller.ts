import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../../guards/roles.guard';
import { Roles } from '../../../../decorators/roles.decorator';
import { Public } from '../../../../decorators/public.decorator';
import { WebLocationsService } from './web-locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

/**
 * Web BFF — Locations controller
 * Prefix: /pakipark/web
 *
 * CONTRACT:
 *   GET    /pakipark/web/locations                                 [public]
 *   GET    /pakipark/web/locations/:locationId                     [public]
 *   POST   /pakipark/web/partner/locations                        [partner]
 *   PATCH  /pakipark/web/partner/locations/:locationId            [partner]
 *   GET    /pakipark/web/partner/locations                        [partner]
 *   GET    /pakipark/web/partner/locations/:locationId/dashboard  [partner]
 *   GET    /pakipark/web/locations/:locationId/reviews            [public]
 *   GET    /pakipark/web/partner/locations/:locationId/reviews    [partner]
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pakipark/web')
export class WebLocationsController {
  constructor(private readonly locationsService: WebLocationsService) {}

  // ── Public customer endpoints ─────────────────────────────────────────────

  @Get('locations')
  @Public()
  searchLocations(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radiusKm') radiusKm = 5,
    @Query('date') date: string,
    @Query('timeSlot') timeSlot: string,
  ) {
    return this.locationsService.searchLocations({ lat: +lat, lng: +lng, radiusKm: +radiusKm, date, timeSlot });
  }

  @Get('locations/:locationId')
  @Public()
  getLocation(@Param('locationId') locationId: string) {
    return this.locationsService.getLocation(locationId);
  }

  @Get('locations/:locationId/reviews')
  @Public()
  getLocationReviews(
    @Param('locationId') locationId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.locationsService.getLocationReviews(locationId, { page: +page, limit: +limit });
  }

  // ── Partner endpoints ─────────────────────────────────────────────────────

  @Post('partner/locations')
  @Roles('partner')
  @HttpCode(HttpStatus.CREATED)
  createLocation(@Body() dto: CreateLocationDto, @Req() req: any) {
    return this.locationsService.createLocation(dto, req.user.sub);
  }

  @Patch('partner/locations/:locationId')
  @Roles('partner')
  updateLocation(
    @Param('locationId') locationId: string,
    @Body() dto: UpdateLocationDto,
    @Req() req: any,
  ) {
    return this.locationsService.updateLocation(locationId, dto, req.user.sub);
  }

  @Get('partner/locations')
  @Roles('partner')
  getPartnerLocations(@Req() req: any) {
    return this.locationsService.getPartnerLocations(req.user.sub);
  }

  @Get('partner/locations/:locationId/dashboard')
  @Roles('partner')
  getLocationDashboard(@Param('locationId') locationId: string, @Req() req: any) {
    return this.locationsService.getLocationDashboard(locationId, req.user.sub);
  }

  @Get('partner/locations/:locationId/reviews')
  @Roles('partner')
  getPartnerLocationReviews(@Param('locationId') locationId: string, @Req() req: any) {
    return this.locationsService.getPartnerLocationReviews(locationId, req.user.sub);
  }
}
