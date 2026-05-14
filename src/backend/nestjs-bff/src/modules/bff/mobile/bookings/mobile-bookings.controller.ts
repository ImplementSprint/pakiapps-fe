import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
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
import { ReservationService } from '../../../domain/reservation/reservation.service';
import { PartnerService } from '../../../domain/partner/partner.service';

/**
 * Mobile BFF — Bookings controller
 * Prefix: /pakipark/mobile
 *
 * CONTRACT:
 *   POST   /pakipark/mobile/bookings
 *   GET    /pakipark/mobile/bookings
 *   GET    /pakipark/mobile/bookings/:bookingId
 *   PATCH  /pakipark/mobile/bookings/:bookingId/cancel
 *   GET    /pakipark/mobile/bookings/:bookingId/qr
 *   GET    /pakipark/mobile/bookings/:bookingId/transactions
 *   POST   /pakipark/mobile/bookings/:bookingId/review
 *   GET    /pakipark/mobile/bookings/:bookingId/review
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pakipark/mobile')
export class MobileBookingsController {
  constructor(
    private readonly reservation: ReservationService,
    private readonly partner: PartnerService,
  ) {}

  @Post('bookings')
  @Roles('customer')
  @HttpCode(HttpStatus.CREATED)
  createBooking(@Body() dto: any, @Req() req: any) {
    return this.reservation.createBooking({ ...dto, userId: req.user.sub });
  }

  @Get('bookings')
  @Roles('customer')
  getBookings(
    @Query('status') status: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Req() req: any,
  ) {
    return this.reservation.listBookings(req.user.sub, { status, page: +page, limit: +limit });
  }

  @Get('bookings/:bookingId')
  @Roles('customer')
  getBookingById(@Param('bookingId') bookingId: string, @Req() req: any) {
    return this.reservation.findBooking(bookingId);
  }

  @Patch('bookings/:bookingId/cancel')
  @Roles('customer')
  cancelBooking(
    @Param('bookingId') bookingId: string,
    @Body() body: { cancelReason: string },
    @Req() req: any,
  ) {
    return this.reservation.cancelBooking(bookingId, body.cancelReason, req.user.sub);
  }

  @Get('bookings/:bookingId/qr')
  @Roles('customer')
  getQr(@Param('bookingId') bookingId: string) {
    return this.reservation.getQr(bookingId);
  }

  @Get('bookings/:bookingId/transactions')
  @Roles('customer')
  getTransactions(@Param('bookingId') bookingId: string) {
    return this.reservation.getTransactions(bookingId);
  }

  @Post('bookings/:bookingId/review')
  @Roles('customer')
  @HttpCode(HttpStatus.CREATED)
  postReview(
    @Param('bookingId') bookingId: string,
    @Body() body: { locationId: string; rating: number; comment?: string },
    @Req() req: any,
  ) {
    return this.partner.createReview({ bookingId, userId: req.user.sub, ...body });
  }

  @Get('bookings/:bookingId/review')
  @Roles('customer')
  getReview(@Param('bookingId') bookingId: string, @Req() req: any) {
    return this.partner.getReviewByBooking(bookingId, req.user.sub);
  }
}
