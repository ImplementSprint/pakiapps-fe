import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../shared/supabase/supabase.service';

/**
 * Domain service — reservation schema
 * Owns: bookings, transaction_logs
 * Rule: No DB joins across schemas. Cross-schema data resolved via internal API calls.
 */
@Injectable()
export class ReservationService {
  constructor(private readonly supabase: SupabaseService) {}

  async createBooking(data: Record<string, any>) {
    const { data: booking, error } = await this.supabase.client
      .schema('reservation')
      .from('bookings')
      .insert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return booking;
  }

  async listBookings(userId: string, filters: { status?: string; page: number; limit: number }) {
    let query = this.supabase.client
      .schema('reservation')
      .from('bookings')
      .select('id, reference, locationName, date, timeSlot, status, amount, paymentStatus')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .range((filters.page - 1) * filters.limit, filters.page * filters.limit - 1);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  async findBooking(bookingId: string) {
    const { data, error } = await this.supabase.client
      .schema('reservation')
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw new Error(error.message);
    return data;
  }

  async cancelBooking(bookingId: string, cancelReason: string, userId: string) {
    const { data, error } = await this.supabase.client
      .schema('reservation')
      .from('bookings')
      .update({ status: 'cancelled', cancelReason, cancelledAt: new Date().toISOString() })
      .eq('id', bookingId)
      .eq('userId', userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getQr(bookingId: string) {
    const { data, error } = await this.supabase.client
      .schema('reservation')
      .from('bookings')
      .select('id, reference, barcode, status')
      .eq('id', bookingId)
      .single();
    if (error) throw new Error(error.message);
    return {
      bookingId: data.id,
      reference: data.reference,
      barcode: data.barcode,
      qrCodeUrl: `/qr/${data.barcode}`,
      status: data.status,
    };
  }

  async getTransactions(bookingId: string) {
    const { data, error } = await this.supabase.client
      .schema('reservation')
      .from('transaction_logs')
      .select('id, type, amount, details, createdAt')
      .eq('bookingId', bookingId)
      .order('createdAt', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async getPartnerRevenue(
    locationId: string,
    period: 'today' | 'week' | 'month',
    partnerId: string,
  ) {
    // Simplified — real implementation adds date range filter based on period
    const { data, error } = await this.supabase.client
      .schema('reservation')
      .from('transaction_logs')
      .select('bookingId, type, amount, createdAt')
      .eq('locationId', locationId)
      .order('createdAt', { ascending: false });
    if (error) throw new Error(error.message);

    const totalRevenue = (data ?? []).reduce((sum: number, r: any) => sum + (r.amount ?? 0), 0);
    return { totalRevenue, transactionCount: (data ?? []).length, breakdown: data };
  }

  async vehicleHasActiveBooking(vehicleId: string): Promise<boolean> {
    const { data, error } = await this.supabase.client
      .schema('reservation')
      .from('bookings')
      .select('id')
      .eq('vehicleId', vehicleId)
      .in('status', ['upcoming', 'active'])
      .limit(1);
    if (error) throw new Error(error.message);
    return (data ?? []).length > 0;
  }

  /** Internal API surface: GET /internal/booking/:bookingId/summary */
  async getBookingSummary(bookingId: string) {
    const { data, error } = await this.supabase.client
      .schema('reservation')
      .from('bookings')
      .select('id, reference, status, parkingSlotId, locationId, checkInDeadline')
      .eq('id', bookingId)
      .single();
    if (error) throw new NotFoundException('Booking not found');
    return {
      bookingId: data.id,
      reference: data.reference,
      status: data.status,
      slotId: data.parkingSlotId,
      locationId: data.locationId,
      checkInDeadline: data.checkInDeadline,
    };
  }
}
