import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../shared/supabase/supabase.service';
import { SharedAuthService } from '../../shared/auth/shared-auth.service';

/**
 * Domain service — teller schema
 * Owns: vehicles, uploads, settings
 */
@Injectable()
export class TellerService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly sharedAuth: SharedAuthService,
  ) {}

  // ── Vehicles ──────────────────────────────────────────────────────────────

  async getVehicles(userId: string) {
    const { data, error } = await this.supabase.client
      .schema('teller')
      .from('vehicles')
      .select('id, brand, model, plateNumber, type, color, isDefault')
      .eq('userId', userId);
    if (error) throw new Error(error.message);
    return data;
  }

  async addVehicle(data: Record<string, any>, userId: string) {
    const { data: vehicle, error } = await this.supabase.client
      .schema('teller')
      .from('vehicles')
      .insert({ ...data, userId })
      .select('id, plateNumber')
      .single();
    if (error) throw new Error(error.message);
    return { vehicleId: vehicle.id, plateNumber: vehicle.plateNumber };
  }

  async updateVehicle(vehicleId: string, data: Record<string, any>, userId: string) {
    const { data: vehicle, error } = await this.supabase.client
      .schema('teller')
      .from('vehicles')
      .update(data)
      .eq('id', vehicleId)
      .eq('userId', userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return vehicle;
  }

  async deleteVehicle(vehicleId: string, userId: string) {
    const { error } = await this.supabase.client
      .schema('teller')
      .from('vehicles')
      .delete()
      .eq('id', vehicleId)
      .eq('userId', userId);
    if (error) throw new Error(error.message);
  }

  async verifyVehicleByPlate(plateNumber: string) {
    const { data: vehicle, error } = await this.supabase.client
      .schema('teller')
      .from('vehicles')
      .select('id, brand, model, plateNumber, type, color, userId')
      .eq('plateNumber', plateNumber)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!vehicle) return null;

    // Resolve userId → customer name via shared-service
    const profile = await this.sharedAuth.getUserSummary(vehicle.userId).catch(() => null);

    // Check for active booking — calls reservation schema via Supabase directly
    const { data: activeBookings } = await this.supabase.client
      .schema('reservation')
      .from('bookings')
      .select('id, reference, parkingSlotId, checkInDeadline')
      .eq('vehicleId', vehicle.id)
      .in('status', ['upcoming', 'active'])
      .limit(1);

    const activeBooking = activeBookings?.[0] ?? null;

    return {
      vehicleId: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      plateNumber: vehicle.plateNumber,
      type: vehicle.type,
      color: vehicle.color,
      userId: vehicle.userId,
      customerName: profile?.name ?? null,
      hasActiveBooking: !!activeBooking,
      activeBooking: activeBooking
        ? {
            bookingId: activeBooking.id,
            reference: activeBooking.reference,
            slot: activeBooking.parkingSlotId,
            checkInDeadline: activeBooking.checkInDeadline,
          }
        : null,
    };
  }

  // ── Settings ──────────────────────────────────────────────────────────────

  async getPublicSettings() {
    const keys = [
      'cancellationPenaltyRate',
      'pwdDiscountRate',
      'seniorDiscountRate',
      'maxAdvanceBookingDays',
    ];
    const { data, error } = await this.supabase.client
      .schema('teller')
      .from('settings')
      .select('key, value')
      .in('key', keys);
    if (error) throw new Error(error.message);

    return (data ?? []).reduce((acc: Record<string, any>, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
  }

  async getAllSettings() {
    const { data, error } = await this.supabase.client
      .schema('teller')
      .from('settings')
      .select('id, key, value, updatedAt')
      .order('key');
    if (error) throw new Error(error.message);
    return data;
  }

  async updateSetting(key: string, value: any) {
    const { data, error } = await this.supabase.client
      .schema('teller')
      .from('settings')
      .upsert({ key, value, updatedAt: new Date().toISOString() }, { onConflict: 'key' })
      .select('key, value, updatedAt')
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  // ── Uploads ───────────────────────────────────────────────────────────────

  async createLocationUpload(
    locationId: string,
    entityType: 'location' | 'permit',
    url: string,
    uploadedBy: string,
  ) {
    const { data, error } = await this.supabase.client
      .schema('teller')
      .from('uploads')
      .insert({ entityType, entityId: locationId, url, uploadedBy })
      .select('id, url, entityType')
      .single();
    if (error) throw new Error(error.message);
    return { uploadId: data.id, url: data.url, entityType: data.entityType };
  }

  async createVehicleUpload(
    vehicleId: string,
    entityType: 'or_doc' | 'cr_doc',
    url: string,
    uploadedBy: string,
  ) {
    const { data, error } = await this.supabase.client
      .schema('teller')
      .from('uploads')
      .insert({ entityType, entityId: vehicleId, url, uploadedBy })
      .select('id, url')
      .single();
    if (error) throw new Error(error.message);
    return { uploadId: data.id, url: data.url };
  }
}
