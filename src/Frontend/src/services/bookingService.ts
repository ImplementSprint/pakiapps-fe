import { api } from '../lib/api';

export interface Booking {
  _id: string;
  id?: number;
  reference: string;
  barcode?: string;
  spot: string;
  date: string;
  timeSlot: string;
  type: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled' | 'no_show';
  amount: number;
  finalAmount?: number;
  paymentMethod: string;
  paymentStatus: 'paid' | 'pending' | 'partial' | 'refunded';
  checkInAt?: string | null;
  checkOutAt?: string | null;
  checkedInByTeller?: boolean;

  // ── Snapshot columns (populated at booking-creation time — no JOIN needed) ──
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  vehicleType?: string;
  vehicleColor?: string;
  locationName?: string;
  locationAddress?: string;

  // Legacy nested shape (kept for backward compatibility with older code)
  userId?: { _id: string; name: string; email: string; phone?: string } | number;
  vehicleId?: { _id: string; brand: string; model: string; plateNumber: string; type: string } | number;
  locationId?: { _id: string; name: string; address: string } | number;

  createdAt: string;
  cancelledAt?: string;
  cancelReason?: string;
}

export interface CreateBookingPayload {
  vehicleId: string;
  locationId: string;
  spot: string;
  date: string;
  timeSlot: string;
  amount: number;
  paymentMethod: string;
  parkingSlotId?: string;
}

export const bookingService = {
  async getMyBookings(params?: { status?: string; search?: string; page?: number }) {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    const res = await api.get<{ bookings: Booking[]; total: number; page: number; totalPages: number }>(`/bookings/my?${query.toString()}`);
    return res.data!;
  },

  async getAllBookings(params?: { status?: string; search?: string; date?: string; locationId?: string; page?: number }) {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.date) query.set('date', params.date);
    if (params?.locationId) query.set('locationId', params.locationId);
    if (params?.page) query.set('page', String(params.page));
    const res = await api.get<{ bookings: Booking[]; total: number; page: number; totalPages: number }>(`/bookings?${query.toString()}`);
    return res.data!;
  },

  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    const res = await api.post<Booking>('/bookings', payload);
    return res.data!;
  },

  async cancelBooking(bookingId: string, reason?: string): Promise<Booking> {
    const res = await api.patch<Booking>(`/bookings/${bookingId}/cancel`, { reason });
    return res.data!;
  },

  async getBookingById(id: string): Promise<Booking> {
    const res = await api.get<Booking>(`/bookings/${id}`);
    return res.data!;
  },

  async updateBookingStatus(id: string, status: 'active' | 'completed' | 'cancelled' | 'no_show'): Promise<Booking> {
    const res = await api.patch<Booking>(`/bookings/${id}/status`, { status });
    return res.data!;
  },

  async checkOut(id: string): Promise<{ booking: Booking; billing: any }> {
    const res = await api.patch<any>(`/bookings/${id}/checkout`, {});
    const data = res.data as any;
    return { booking: data, billing: data.billing };
  },

  async getAvailableSlots(locationId: string, date: string) {
    const res = await api.get<any[]>(`/bookings/slots/${locationId}?date=${date}`);
    return res.data!;
  },

  /** Teller check-in (SCRUM-1007) — uses dedicated /checkin endpoint */
  async checkIn(id: string): Promise<Booking> {
    const res = await api.patch<any>(`/bookings/${id}/checkin`, {});
    return (res.data?.data ?? res.data) as Booking;
  },
};
