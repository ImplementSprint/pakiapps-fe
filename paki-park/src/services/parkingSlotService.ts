import { api } from '../lib/api';

export interface ParkingSlot {
  _id?: string;
  id?: string;
  label: string;
  floor: number;
  type: string; // 'regular' | 'handicapped' | 'ev_charging' | 'vip' | 'motorcycle'
  size: string; // 'compact' | 'standard' | 'large'
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
}

export const parkingSlotService = {
  async getSlotsByLocation(locationId: string): Promise<ParkingSlot[]> {
    const res = await api.get(`/parking-slots/location/${locationId}`);
    return res.data;
  },
  
  async getAvailableSlots(locationId: string, date: string, timeSlot: string): Promise<ParkingSlot[]> {
    const res = await api.get(`/parking-slots/available/${locationId}?date=${date}&timeSlot=${encodeURIComponent(timeSlot)}`);
    return res.data;
  },

  async updateSlot(slotId: string, data: Partial<ParkingSlot>) {
    const res = await api.put(`/parking-slots/${slotId}`, data);
    return res.data;
  },

  async createSlot(data: ParkingSlot) {
    const res = await api.post(`/parking-slots`, data);
    return res.data;
  },

  async deleteSlot(slotId: string) {
    const res = await api.delete(`/parking-slots/${slotId}`);
    return res.data;
  },

  async getDashboardSlots(locationId: string, date: string) {
    const res = await api.get(`/parking-slots/dashboard/${locationId}?date=${date}`);
    return {
      slots: res.data || [],
      recommendedPollMs: res.recommendedPollMs || 60000,
    };
  },

  async generateSlots(data: { locationId: string; sections?: string[]; slotsPerSection?: number; floors?: number; slots?: any[] }) {
    const res = await api.post(`/parking-slots/generate`, data);
    return res.data;
  },
};
