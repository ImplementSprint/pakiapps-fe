import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../../shared/supabase/supabase.service';

/**
 * Domain service — parking_lot schema
 * Owns: locations, parking_slots, parking_rates
 */
@Injectable()
export class ParkingLotService {
  constructor(private readonly supabase: SupabaseService) {}

  // ── Locations ─────────────────────────────────────────────────────────────

  async searchLocations(filters: {
    lat: number;
    lng: number;
    radiusKm: number;
    date?: string;
    timeSlot?: string;
  }) {
    // NOTE: actual geo-filter requires a PostGIS/RPC call; simplified here
    const { data, error } = await this.supabase.client
      .schema('parking_lot')
      .from('locations')
      .select('id, name, address, lat, lng, totalSpots, availableSpots, pricePerHour, imageUrl, operatingHours, amenities, isActive')
      .eq('isActive', true);
    if (error) throw new Error(error.message);
    return data;
  }

  async getLocationDetail(locationId: string) {
    const { data, error } = await this.supabase.client
      .schema('parking_lot')
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single();
    if (error && error.code === 'PGRST116') throw new NotFoundException('Location not found');
    if (error) throw new Error(error.message);
    return data;
  }

  async createLocation(data: Record<string, any>) {
    const { data: loc, error } = await this.supabase.client
      .schema('parking_lot')
      .from('locations')
      .insert({ ...data, status: 'pending_approval' })
      .select('id, name, status')
      .single();
    if (error) throw new Error(error.message);
    return { locationId: loc.id, name: loc.name, status: 'pending_approval' };
  }

  async updateLocation(locationId: string, data: Record<string, any>, partnerId: string) {
    const { data: loc, error } = await this.supabase.client
      .schema('parking_lot')
      .from('locations')
      .update(data)
      .eq('id', locationId)
      .eq('partnerId', partnerId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return loc;
  }

  async getPartnerLocations(partnerId: string) {
    const { data, error } = await this.supabase.client
      .schema('parking_lot')
      .from('locations')
      .select('id, name, address, totalSpots, availableSpots, pricePerHour, isActive')
      .eq('partnerId', partnerId);
    if (error) throw new Error(error.message);
    return data;
  }

  async getLocationDashboard(locationId: string, partnerId: string) {
    // Verify ownership
    const loc = await this.getLocationDetail(locationId);
    if (loc.partnerId !== partnerId) throw new ForbiddenException();

    const { data: bookings, error } = await this.supabase.client
      .schema('reservation')
      .from('bookings')
      .select('id, status')
      .eq('locationId', locationId);
    if (error) throw new Error(error.message);

    const todayBookings = bookings.filter((b: any) => b.status !== 'cancelled').length;
    const currentlyOccupied = bookings.filter((b: any) => b.status === 'active').length;
    const availableSpots = (loc.totalSpots ?? 0) - currentlyOccupied;
    const occupancyRate = loc.totalSpots ? currentlyOccupied / loc.totalSpots : 0;

    return { todayBookings, currentlyOccupied, availableSpots, todayRevenue: 0, occupancyRate };
  }

  /** Internal API surface: GET /internal/location/:locationId/summary */
  async getLocationSummary(locationId: string) {
    const { data, error } = await this.supabase.client
      .schema('parking_lot')
      .from('locations')
      .select('id, name, address, isActive, pricePerHour')
      .eq('id', locationId)
      .single();
    if (error) throw new NotFoundException('Location not found');
    return { locationId: data.id, ...data };
  }

  // ── Slots ─────────────────────────────────────────────────────────────────

  async getAvailableSlots(locationId: string, date: string, timeSlot: string) {
    const { data, error } = await this.supabase.client
      .schema('parking_lot')
      .from('parking_slots')
      .select('id, label, section, floor, type, status, vehicleTypeAllowed')
      .eq('locationId', locationId)
      .eq('status', 'available');
    if (error) throw new Error(error.message);
    return data;
  }

  async getAllSlots(locationId: string, partnerId: string) {
    const { data, error } = await this.supabase.client
      .schema('parking_lot')
      .from('parking_slots')
      .select('id, label, section, floor, type, status, vehicleTypeAllowed')
      .eq('locationId', locationId);
    if (error) throw new Error(error.message);
    return data;
  }

  async createSlot(locationId: string, data: Record<string, any>, partnerId: string) {
    const { data: slot, error } = await this.supabase.client
      .schema('parking_lot')
      .from('parking_slots')
      .insert({ ...data, locationId, status: 'available' })
      .select('id, label, status')
      .single();
    if (error) throw new Error(error.message);
    return { slotId: slot.id, label: slot.label, status: 'available' };
  }

  async updateSlot(locationId: string, slotId: string, data: Record<string, any>, partnerId: string) {
    const { data: slot, error } = await this.supabase.client
      .schema('parking_lot')
      .from('parking_slots')
      .update(data)
      .eq('id', slotId)
      .eq('locationId', locationId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return slot;
  }

  async getTellerView(locationId: string) {
    const { data, error } = await this.supabase.client
      .schema('parking_lot')
      .from('parking_slots')
      .select('id, label, section, floor, type, status, currentBookingId')
      .eq('locationId', locationId);
    if (error) throw new Error(error.message);
    return data;
  }

  // ── Rates ─────────────────────────────────────────────────────────────────

  async getRates(locationId: string) {
    const { data, error } = await this.supabase.client
      .schema('parking_lot')
      .from('parking_rates')
      .select('id, type, rate')
      .eq('locationId', locationId);
    if (error) throw new Error(error.message);
    return data;
  }

  async getPartnerRates(locationId: string, partnerId: string) {
    const { data, error } = await this.supabase.client
      .schema('parking_lot')
      .from('parking_rates')
      .select('id, type, rate, createdAt')
      .eq('locationId', locationId);
    if (error) throw new Error(error.message);
    return data;
  }

  async createRate(locationId: string, data: { type: string; rate: number }, partnerId: string) {
    const { data: rate, error } = await this.supabase.client
      .schema('parking_lot')
      .from('parking_rates')
      .insert({ ...data, locationId })
      .select('id, type, rate')
      .single();
    if (error) throw new Error(error.message);
    return { rateId: rate.id, type: rate.type, rate: rate.rate };
  }

  async updateRate(locationId: string, rateId: string, rate: number, partnerId: string) {
    const { data, error } = await this.supabase.client
      .schema('parking_lot')
      .from('parking_rates')
      .update({ rate })
      .eq('id', rateId)
      .eq('locationId', locationId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteRate(locationId: string, rateId: string, partnerId: string) {
    const { error } = await this.supabase.client
      .schema('parking_lot')
      .from('parking_rates')
      .delete()
      .eq('id', rateId)
      .eq('locationId', locationId);
    if (error) throw new Error(error.message);
  }
}
