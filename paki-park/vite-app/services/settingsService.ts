import { api } from './api';

export interface ParkingRate {
  _id: string;
  vehicleType: string;
  hourlyRate: number;
  dailyRate: number;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
}

export const settingsService = {
  async getSettings(category: string): Promise<Record<string, any>> {
    const res = await api.get<Record<string, any>>(`/settings/${category}`);
    return res.data!;
  },

  async updateSettings(category: string, updates: Record<string, any>) {
    return await api.put(`/settings/${category}`, updates);
  },

  async getParkingRates(): Promise<ParkingRate[]> {
    const res = await api.get<ParkingRate[]>('/settings/parking-rates');
    return res.data!;
  },

  async updateParkingRate(id: string, payload: Partial<ParkingRate>): Promise<ParkingRate> {
    const res = await api.put<ParkingRate>(`/settings/parking-rates/${id}`, payload);
    return res.data!;
  },

  async getAdminUsers(): Promise<AdminUser[]> {
    const res = await api.get<AdminUser[]>('/settings/admin-users');
    return res.data!;
  },
};
