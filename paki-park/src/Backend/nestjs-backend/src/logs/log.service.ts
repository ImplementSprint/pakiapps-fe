import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

/**
 * LogService — writes to:
 *   reservation.transaction_logs  (id, booking_id, user_id, type, amount, details, created_at, updated_at)
 *   partner.activity_logs         (id, admin_id, action, target_type, target_id, details, created_at)
 *
 * All IDs are now UUIDs (auth IDs). No public schema.
 */
@Injectable()
export class LogService {
  constructor(private sequelize: Sequelize) {}

  async logTransaction(opts: {
    bookingId?: number | null;
    userId?:    string | null;
    type?:      string;
    amount?:    number;
    details?:   object | string | null;
  }): Promise<void> {
    try {
      await this.sequelize.query(
        `INSERT INTO reservation.transaction_logs (booking_id, user_id, type, amount, details, created_at, updated_at)
         VALUES (:bookingId, :userId, :type, :amount, :details::text, now(), now())`,
        { replacements: {
            bookingId: opts.bookingId ?? null,
            userId:    opts.userId    ?? null,
            type:      opts.type      || 'payment',
            amount:    opts.amount    ?? 0,
            details:   opts.details   ? JSON.stringify(opts.details) : null,
          } },
      );
    } catch (err) { console.warn('[LogService] transaction_logs write (non-fatal):', err.message); }
  }

  async logActivity(opts: {
    userId?:      string | null;
    action:       string;
    targetType?:  string | null;
    targetId?:    string | null;
    details?:     object | string | null;
  }): Promise<void> {
    try {
      await this.sequelize.query(
        `INSERT INTO partner.activity_logs (admin_id, action, target_type, target_id, details, created_at)
         VALUES (:userId, :action, :targetType, :targetId, :details::text, now())`,
        { replacements: {
            userId:     opts.userId     ?? null,
            action:     opts.action,
            targetType: opts.targetType ?? null,
            targetId:   opts.targetId   ?? null,
            details:    opts.details    ? JSON.stringify(opts.details) : null,
          } },
      );
    } catch (err) { console.warn('[LogService] activity_logs write (non-fatal):', err.message); }
  }

  // ── Convenience wrappers ──────────────────────────────────────────────────

  logBookingCreated({ booking, userId }: any) {
    Promise.all([
      this.logTransaction({ bookingId: booking.id, userId, type: 'payment', amount: booking.amount, details: { ref: booking.reference, spot: booking.spot, date: booking.date, timeSlot: booking.timeSlot, paymentMethod: booking.paymentMethod } }),
      this.logActivity({ userId, action: 'BOOKING_CREATED', targetType: 'Booking', targetId: String(booking.id || ''), details: { reference: booking.reference, amount: booking.amount, spot: booking.spot } }),
    ]).catch(() => {});
  }

  logBookingCancelled({ booking, userId, reason, refundAmount = 0, refundType = 'none', isRefund = false }: any) {
    Promise.all([
      isRefund && refundAmount > 0
        ? this.logTransaction({ bookingId: booking.id, userId, type: refundType === 'partial_refund' ? 'partial_refund' : 'refund', amount: refundAmount, details: { ref: booking.reference, reason, refundType } })
        : Promise.resolve(),
      this.logActivity({ userId, action: 'BOOKING_CANCELLED', targetType: 'Booking', targetId: String(booking.id || ''), details: { reference: booking.reference, reason, refundAmount, refundType } }),
    ]).catch(() => {});
  }

  logBookingCheckIn({ booking, adminId }: any) {
    this.logActivity({ userId: adminId, action: 'BOOKING_CHECKIN', targetType: 'Booking', targetId: String(booking.id || ''), details: { reference: booking.reference, spot: booking.spot } }).catch(() => {});
  }

  logBookingCheckOut({ booking, adminId }: any) {
    this.logActivity({ userId: adminId, action: 'BOOKING_CHECKOUT', targetType: 'Booking', targetId: String(booking.id || ''), details: { reference: booking.reference, spot: booking.spot } }).catch(() => {});
  }

  logBookingNoShow({ booking, adminId }: any) {
    this.logActivity({ userId: adminId, action: 'BOOKING_NO_SHOW', targetType: 'Booking', targetId: String(booking.id || ''), details: { reference: booking.reference } }).catch(() => {});
  }

  logUserLogin({ userId, role }: any) {
    this.logActivity({ userId, action: role === 'admin' ? 'ADMIN_LOGIN' : 'USER_LOGIN', targetType: 'User', targetId: userId, details: { role } }).catch(() => {});
  }

  logUserRegistered({ userId, role }: any) {
    this.logActivity({ userId, action: 'USER_REGISTERED', targetType: 'User', targetId: userId, details: { role } }).catch(() => {});
  }
}
