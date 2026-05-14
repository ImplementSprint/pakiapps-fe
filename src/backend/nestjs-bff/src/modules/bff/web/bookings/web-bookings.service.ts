import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ReservationService } from '../../../domain/reservation/reservation.service';
import { PartnerService } from '../../../domain/partner/partner.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';

/**
 * Web BFF bookings service — thin orchestration layer.
 * Delegates domain logic to ReservationService and PartnerService.
 * Never touches Supabase directly; calls domain services.
 */
@Injectable()
export class WebBookingsService {
  constructor(
    private readonly reservation: ReservationService,
    private readonly partner: PartnerService,
  ) {}

  async createBooking(dto: CreateBookingDto, userId: string) {
    // TODO: call payment/initiate via SharedPaymentService before persisting booking
    return this.reservation.createBooking({ ...dto, userId });
  }

  async getBookings(
    userId: string,
    filters: { status?: string; page: number; limit: number },
  ) {
    return this.reservation.listBookings(userId, filters);
  }

  async getBookingById(bookingId: string, userId: string) {
    const booking = await this.reservation.findBooking(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) throw new ForbiddenException();
    return booking;
  }

  async cancelBooking(bookingId: string, dto: CancelBookingDto, userId: string) {
    // TODO: call payment/refund via SharedPaymentService after cancellation
    return this.reservation.cancelBooking(bookingId, dto.cancelReason, userId);
  }

  async getBookingQr(bookingId: string, userId: string) {
    const booking = await this.reservation.findBooking(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) throw new ForbiddenException();
    return this.reservation.getQr(bookingId);
  }

  async getBookingTransactions(bookingId: string, userId: string) {
    const booking = await this.reservation.findBooking(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) throw new ForbiddenException();
    return this.reservation.getTransactions(bookingId);
  }

  async getPartnerTransactions(
    locationId: string,
    period: 'today' | 'week' | 'month',
    partnerId: string,
  ) {
    return this.reservation.getPartnerRevenue(locationId, period, partnerId);
  }

  async postReview(
    bookingId: string,
    body: { locationId: string; rating: number; comment?: string },
    userId: string,
  ) {
    return this.partner.createReview({ bookingId, userId, ...body });
  }

  async getReview(bookingId: string, userId: string) {
    return this.partner.getReviewByBooking(bookingId, userId);
  }
}
