import { api } from './api';

export interface ParkingSlot {
  _id: string;
  locationId: string;
  label: string;
  section: string;
  floor: number;
  type: 'regular' | 'handicapped' | 'ev_charging' | 'vip' | 'motorcycle';
  /** Physical bay size: compact (moto), standard (sedan), large (SUV/EV/VIP) */
  size: 'compact' | 'standard' | 'large';
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  vehicleTypeAllowed: 'sedan' | 'suv' | 'van' | 'truck' | 'motorcycle' | 'any';
}

/** Timing metadata computed server-side — reflects the current lifecycle state */
export interface BookingTiming {
  minutesUntilStart: number;   // +ve = future, -ve = started
  minutesPastEnd: number;      // +ve = past end, -ve = still within window
  isToday: boolean;
  isArrivingSoon: boolean;     // starts within 60 min
  isInGracePeriod: boolean;    // start passed, within 30-min grace window
  isNoShow: boolean;           // past grace, still upcoming
  isOverstay: boolean;         // active, past end time
  overstayMinutes: number;
  gracePeriodMinLeft: number;
  gracePeriodExpiresAt: string;  // "HH:MM"
  expectedEndAt: string;         // "HH:MM"
  timingState:
    | 'reserved'         // future upcoming
    | 'arriving_soon'    // starts < 60 min
    | 'in_grace_period'  // start passed, grace running
    | 'no_show'          // past grace, still upcoming
    | 'occupied'         // active, within window
    | 'overstay';        // active, past end time
}

/** Extended slot with real-time booking info — used by the admin dashboard */
export interface DashboardSlot extends ParkingSlot {
  derivedStatus:
    | 'available'
    | 'reserved'
    | 'arriving_soon'
    | 'in_grace_period'
    | 'no_show'
    | 'occupied'
    | 'overstay'
    | 'maintenance';
  booking?: {
    _id: string;
    reference: string;
    timeSlot: string;
    status: 'upcoming' | 'active' | 'completed' | 'cancelled';
    amount?: number;
    paymentMethod?: string;
    timing?: BookingTiming | null;
    user?: { name: string; phone?: string; email?: string };
    vehicle?: { plateNumber: string; type: string; brand: string; model: string; color?: string };
  } | null;
}

export interface CreateParkingSlotPayload {
  locationId: string;
  label: string;
  section: string;
  floor: number;
  type?: string;
  size?: string;
  vehicleTypeAllowed?: string;
}

export interface GenerateSlotsPayload {
  locationId: string;
  sections: string[];
  slotsPerSection: number;
  floors: number;
}

export const parkingSlotService = {
  async getSlotsByLocation(locationId: string): Promise<ParkingSlot[]> {
    const res = await api.get<ParkingSlot[]>(`/parking-slots/location/${locationId}`);
    return res.data!;
  },

  /** Real-time dashboard data: slots + booking overlays for a location+date */
  async getDashboardSlots(locationId: string, date: string): Promise<{ slots: DashboardSlot[]; recommendedPollMs: number; serverTime: string }> {
    const res = await api.get<any>(`/parking-slots/dashboard/${locationId}?date=${date}`);
    return {
      slots: res.data!,
      recommendedPollMs: (res as any).recommendedPollMs ?? 45_000,
      serverTime: (res as any).serverTime ?? new Date().toISOString(),
    };
  },

  async getSlot(id: string): Promise<ParkingSlot> {
    const res = await api.get<ParkingSlot>(`/parking-slots/${id}`);
    return res.data!;
  },

  async createSlot(payload: CreateParkingSlotPayload): Promise<ParkingSlot> {
    const res = await api.post<ParkingSlot>('/parking-slots', payload);
    return res.data!;
  },

  async updateSlot(id: string, payload: Partial<ParkingSlot>): Promise<ParkingSlot> {
    const res = await api.put<ParkingSlot>(`/parking-slots/${id}`, payload);
    return res.data!;
  },

  async deleteSlot(id: string) {
    return await api.delete(`/parking-slots/${id}`);
  },

  async generateSlots(payload: GenerateSlotsPayload): Promise<ParkingSlot[]> {
    const res = await api.post<ParkingSlot[]>('/parking-slots/generate', payload);
    return res.data!;
  },

  async getAvailableSlots(locationId: string, date: string, timeSlot: string): Promise<ParkingSlot[]> {
    const res = await api.get<ParkingSlot[]>(
      `/parking-slots/available/${locationId}?date=${date}&timeSlot=${encodeURIComponent(timeSlot)}`
    );
    return res.data!;
  },
};