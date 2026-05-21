import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { BookingModel } from '../models/booking.model';
import { NotificationService } from '../notification/notification.service';
import { LogService } from '../logs/log.service';
import { formatBooking } from '../common/formatters';

const GRACE_PERIOD_MIN = 15;

function slotStartDate(dateStr: string, timeSlot: string): Date | null {
  const match = String(timeSlot).match(/(\d{1,2}):(\d{2})\s*[-–]/);
  if (!match) return null;
  const [, hh, mm] = match;
  const d = new Date(`${dateStr}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * SchedulerService — uses reservation.bookings (ORM) + parking_lot.locations (raw SQL).
 * No public schema. userId is always a UUID string.
 * Tracks reminders in-memory to prevent schema mismatch with missing DB columns.
 */
@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  private sentReminders = new Set<string>(); // Transient in-memory reminder tracker

  constructor(
    @InjectModel(BookingModel) private bookingModel: typeof BookingModel,
    private sequelize: Sequelize,
    private notifSvc: NotificationService,
    private logSvc:   LogService,
  ) {}

  onModuleInit() {
    console.log(`[Forfeiture] 🕐 Scheduler started — grace: ${GRACE_PERIOD_MIN} min, sweep: every 60s`);
    this.runForfeitureSweep();
    this.runReminderSweep();
    this.timer = setInterval(() => {
      this.runForfeitureSweep();
      this.runReminderSweep();
    }, 60 * 1000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async runForfeitureSweep(): Promise<void> {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      const candidates = await this.bookingModel.findAll({
        where: { status: 'upcoming', date: todayStr, checkInAt: null },
        raw: true,
      });
      if (!candidates.length) return;

      const toForfeit = candidates.filter((b) => {
        const start = slotStartDate((b as any).date, (b as any).timeSlot);
        return start && start.getTime() + GRACE_PERIOD_MIN * 60_000 < now.getTime();
      });
      if (!toForfeit.length) return;

      const ids = toForfeit.map((b) => (b as any).id);
      await this.bookingModel.update(
        { status: 'cancelled' } as any,
        { where: { id: { [Op.in]: ids } } },
      );

      // Restore available_spots in parking_lot.locations — no public schema
      const perLocation: Record<string, number> = {};
      toForfeit.forEach((b) => {
        const lid = (b as any).locationId;
        if (lid) perLocation[String(lid)] = (perLocation[String(lid)] || 0) + 1;
      });
      await Promise.all(
        Object.entries(perLocation).map(([locId, count]) =>
          this.sequelize.query(
            `UPDATE parking_lot.locations SET available_spots = available_spots + :count WHERE id = :id`,
            { replacements: { count, id: locId } },
          ),
        ),
      );

      // Notify & log
      for (const b of toForfeit) {
        try {
          const fmt = formatBooking(b);
          this.logSvc.logBookingNoShow({ booking: fmt, adminId: null });
          this.notifSvc.notifyNoShow(String((b as any).userId), { ...fmt, id: (b as any).id });
        } catch { /* never crash scheduler */ }
      }

      console.log(`[Forfeiture] ⏰ Auto-forfeited ${toForfeit.length} no-show(s): [${toForfeit.map((b) => (b as any).reference || (b as any).id).join(', ')}]`);
    } catch (err: any) {
      console.error('[Forfeiture] ❌ Sweep error:', err.message);
    }
  }

  async runReminderSweep(): Promise<void> {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const nowMs = now.getTime();

      const candidates = await this.bookingModel.findAll({
        where: { status: 'upcoming', date: todayStr, checkInAt: null },
        raw: true,
      });

      for (const b of candidates) {
        const id = (b as any).id;
        if (this.sentReminders.has(id)) continue;

        const start = slotStartDate((b as any).date, (b as any).timeSlot);
        if (!start) continue;
        const minsUntil = (start.getTime() - nowMs) / 60_000;
        if (minsUntil > 0 && minsUntil <= 30) {
          this.sentReminders.add(id);
          const fmt = formatBooking(b);
          this.notifSvc.notifyBookingReminder(String((b as any).userId), { ...fmt, id });
          console.log(`[Reminder] 🔔 30-min reminder → booking ${(b as any).reference} (user ${(b as any).userId})`);
        }
      }
    } catch (err: any) {
      console.error('[Reminder] ❌ Sweep error:', err.message);
    }
  }
}
