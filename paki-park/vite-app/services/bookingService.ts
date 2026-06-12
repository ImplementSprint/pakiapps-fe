import { api } from './api';

export interface Booking {
  _id: string;
  reference: string;
  barcode?: string;
  spot: string;
  date: string;
  timeSlot: string;
  type: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled' | 'no_show';
  amount: number;
  paymentMethod: string;
  paymentStatus: 'paid' | 'pending' | 'partial' | 'refunded';
  checkInAt?: string | null;
  checkOutAt?: string | null;
  userId?: { _id: string; name: string; email: string; phone?: string };
  vehicleId?: { _id: string; brand: string; model: string; plateNumber: string; type: string };
  locationId?: { _id: string; name: string; address: string };
  createdAt: string;
  cancelledAt?: string;
  cancelReason?: string;
}

export interface TimeSlot {
  slot: string;
  booked: number;
  available: number;
  isFull: boolean;
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
    const res = await api.get<{ bookings: Booking[]; total: number; page: number; totalPages: number }>(
      `/bookings/my?${query.toString()}`
    );
    return res.data!;
  },

  async getAllBookings(params?: { status?: string; search?: string; date?: string; locationId?: string; page?: number }) {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.date) query.set('date', params.date);
    if (params?.locationId) query.set('locationId', params.locationId);
    if (params?.page) query.set('page', String(params.page));
    const res = await api.get<{ bookings: Booking[]; total: number; page: number; totalPages: number }>(
      `/bookings?${query.toString()}`
    );
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

  async checkInByReference(reference: string): Promise<Booking> {
    // Normalize: accept both PKP-00000001 and PKP00000001
    const normalized = reference.trim().toUpperCase().replace(/^PKP(\d+)$/, 'PKP-$1');
    const result = await this.getAllBookings({ search: normalized });
    const bookings = result.bookings || [];
    if (bookings.length === 0) {
      throw new Error(`No booking found with reference "${reference}"`);
    }
    const booking = bookings[0];
    if (booking.status === 'completed') throw new Error('This booking has already been completed.');
    if (booking.status === 'cancelled') throw new Error('This booking has been cancelled.');
    return this.updateBookingStatus(booking._id, 'active');
  },

  async getAvailableSlots(locationId: string, date: string): Promise<TimeSlot[]> {
    const res = await api.get<TimeSlot[]>(`/bookings/slots/${locationId}?date=${date}`);
    return res.data!;
  },

  async checkOut(id: string): Promise<{ booking: Booking; billing: { checkInAt: string; checkOutAt: string; durationMins: number; durationLabel: string; ratePerHour: number; finalAmount: number } }> {
    const res = await api.patch<any>(`/bookings/${id}/checkout`, {});
    const data = res.data as any;
    return { booking: data, billing: data.billing };
  },
};