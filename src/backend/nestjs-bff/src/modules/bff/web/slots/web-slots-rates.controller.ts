import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { WebSlotsService } from './web-slots.service';
import { WebRatesService } from '../rates/web-rates.service';

/**
 * Web BFF — Slots + Rates controller
 * Prefix: /pakipark/web
 *
 * SLOTS CONTRACT:
 *   GET    /pakipark/web/locations/:locationId/slots              [public]
 *   GET    /pakipark/web/partner/locations/:locationId/slots     [partner]
 *   POST   /pakipark/web/partner/locations/:locationId/slots     [partner]
 *   PATCH  /pakipark/web/partner/locations/:locationId/slots/:slotId [partner]
 *   GET    /pakipark/web/teller/slots                            [teller]
 *
 * RATES CONTRACT:
 *   GET    /pakipark/web/locations/:locationId/rates             [public]
 *   GET    /pakipark/web/partner/locations/:locationId/rates    [partner]
 *   POST   /pakipark/web/partner/locations/:locationId/rates    [partner]
 *   PATCH  /pakipark/web/partner/locations/:locationId/rates/:rateId [partner]
 *   DELETE /pakipark/web/partner/locations/:locationId/rates/:rateId [partner]
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pakipark/web')
export class WebSlotsRatesController {
  constructor(
    private readonly slotsService: WebSlotsService,
    private readonly ratesService: WebRatesService,
  ) {}

  // ─── SLOTS ──────────────────────────────────────────────────────────────────

  @Get('locations/:locationId/slots')
  @Public()
  getPublicSlots(
    @Param('locationId') locationId: string,
    @Query('date') date: string,
    @Query('timeSlot') timeSlot: string,
  ) {
    return this.slotsService.getPublicSlots(locationId, date, timeSlot);
  }

  @Get('partner/locations/:locationId/slots')
  @Roles('partner')
  getPartnerSlots(@Param('locationId') locationId: string, @Req() req: any) {
    return this.slotsService.getPartnerSlots(locationId, req.user.sub);
  }

  @Post('partner/locations/:locationId/slots')
  @Roles('partner')
  @HttpCode(HttpStatus.CREATED)
  createSlot(
    @Param('locationId') locationId: string,
    @Body() body: { label: string; section: string; floor: number; type: string; vehicleTypeAllowed: string },
    @Req() req: any,
  ) {
    return this.slotsService.createSlot(locationId, body, req.user.sub);
  }

  @Patch('partner/locations/:locationId/slots/:slotId')
  @Roles('partner')
  updateSlot(
    @Param('locationId') locationId: string,
    @Param('slotId') slotId: string,
    @Body() body: { label?: string; type?: string; status?: string; vehicleTypeAllowed?: string },
    @Req() req: any,
  ) {
    return this.slotsService.updateSlot(locationId, slotId, body, req.user.sub);
  }

  @Get('teller/slots')
  @Roles('teller')
  getTellerSlots(@Query('locationId') locationId: string) {
    return this.slotsService.getTellerSlots(locationId);
  }

  // ─── RATES ──────────────────────────────────────────────────────────────────

  @Get('locations/:locationId/rates')
  @Public()
  getPublicRates(@Param('locationId') locationId: string) {
    return this.ratesService.getPublicRates(locationId);
  }

  @Get('partner/locations/:locationId/rates')
  @Roles('partner')
  getPartnerRates(@Param('locationId') locationId: string, @Req() req: any) {
    return this.ratesService.getPartnerRates(locationId, req.user.sub);
  }

  @Post('partner/locations/:locationId/rates')
  @Roles('partner')
  @HttpCode(HttpStatus.CREATED)
  createRate(
    @Param('locationId') locationId: string,
    @Body() body: { type: 'hourly' | 'daily' | 'monthly'; rate: number },
    @Req() req: any,
  ) {
    return this.ratesService.createRate(locationId, body, req.user.sub);
  }

  @Patch('partner/locations/:locationId/rates/:rateId')
  @Roles('partner')
  updateRate(
    @Param('locationId') locationId: string,
    @Param('rateId') rateId: string,
    @Body() body: { rate: number },
    @Req() req: any,
  ) {
    return this.ratesService.updateRate(locationId, rateId, body.rate, req.user.sub);
  }

  @Delete('partner/locations/:locationId/rates/:rateId')
  @Roles('partner')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteRate(
    @Param('locationId') locationId: string,
    @Param('rateId') rateId: string,
    @Req() req: any,
  ) {
    return this.ratesService.deleteRate(locationId, rateId, req.user.sub);
  }
}
