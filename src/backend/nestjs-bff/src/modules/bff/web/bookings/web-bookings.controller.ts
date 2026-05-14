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
import { WebBookingsService } from './web-bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';

/**
 * Web BFF — Bookings controller
 * Prefix: /pakipark/web
 *
 * CONTRACT:
 *   POST   /pakipark/web/bookings
 *   GET    /pakipark/web/bookings
 *   GET    /pakipark/web/bookings/:bookingId
 *   PATCH  /pakipark/web/bookings/:bookingId/cancel
 *   GET    /pakipark/web/bookings/:bookingId/qr
 *   GET    /pakipark/web/bookings/:bookingId/transactions
 *   GET    /pakipark/web/partner/transactions
 *   POST   /pakipark/web/bookings/:bookingId/review
 *   GET    /pakipark/web/bookings/:bookingId/review
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pakipark/web')
export class WebBookingsController {
  constructor(private readonly bookingsService: WebBookingsService) {}

  // ── Customer: create booking ──────────────────────────────────────────────
  @Post('bookings')
  @Roles('customer')
  @HttpCode(HttpStatus.CREATED)
  createBooking(@Body() dto: CreateBookingDto, @Req() req: any) {
    return this.bookingsService.createBooking(dto, req.user.sub);
  }

  // ── Customer: booking history list ────────────────────────────────────────
  @Get('bookings')
  @Roles('customer')
  getBookings(
    @Query('status') status: 'upcoming' | 'active' | 'completed' | 'cancelled',
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Req() req: any,
  ) {
    return this.bookingsService.getBookings(req.user.sub, { status, page: +page, limit: +limit });
  }

  // ── Customer: booking detail ──────────────────────────────────────────────
  @Get('bookings/:bookingId')
  @Roles('customer')
  getBookingById(@Param('bookingId') bookingId: string, @Req() req: any) {
    return this.bookingsService.getBookingById(bookingId, req.user.sub);
  }

  // ── Customer: cancel booking ──────────────────────────────────────────────
  @Patch('bookings/:bookingId/cancel')
  @Roles('customer')
  cancelBooking(
    @Param('bookingId') bookingId: string,
    @Body() dto: CancelBookingDto,
    @Req() req: any,
  ) {
    return this.bookingsService.cancelBooking(bookingId, dto, req.user.sub);
  }

  // ── Customer: QR code for check-in ───────────────────────────────────────
  @Get('bookings/:bookingId/qr')
  @Roles('customer')
  getBookingQr(@Param('bookingId') bookingId: string, @Req() req: any) {
    return this.bookingsService.getBookingQr(bookingId, req.user.sub);
  }

  // ── Customer: payment history per booking ─────────────────────────────────
  @Get('bookings/:bookingId/transactions')
  @Roles('customer')
  getBookingTransactions(@Param('bookingId') bookingId: string, @Req() req: any) {
    return this.bookingsService.getBookingTransactions(bookingId, req.user.sub);
  }

  // ── Partner: revenue per location ─────────────────────────────────────────
  @Get('partner/transactions')
  @Roles('partner')
  getPartnerTransactions(
    @Query('locationId') locationId: string,
    @Query('period') period: 'today' | 'week' | 'month',
    @Req() req: any,
  ) {
    return this.bookingsService.getPartnerTransactions(locationId, period, req.user.sub);
  }

  // ── Customer: post review on completed booking ────────────────────────────
  @Post('bookings/:bookingId/review')
  @Roles('customer')
  @HttpCode(HttpStatus.CREATED)
  postReview(
    @Param('bookingId') bookingId: string,
    @Body() body: { locationId: string; rating: number; comment?: string },
    @Req() req: any,
  ) {
    return this.bookingsService.postReview(bookingId, body, req.user.sub);
  }

  // ── Customer: check if review already submitted ───────────────────────────
  @Get('bookings/:bookingId/review')
  @Roles('customer')
  getReview(@Param('bookingId') bookingId: string, @Req() req: any) {
    return this.bookingsService.getReview(bookingId, req.user.sub);
  }
}
