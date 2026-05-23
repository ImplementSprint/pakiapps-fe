import { api } from './api';

export interface Location {
  _id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  totalSpots: number;
  availableSpots: number;
  hourlyRate: number;
  status: 'active' | 'maintenance' | 'closed';
  operatingHours?: string;
  amenities?: string[];
}

export const locationService = {
  async getLocations(params?: { search?: string; status?: string }): Promise<Location[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    const res = await api.get<Location[]>(`/locations?${query.toString()}`);
    return res.data!;
  },

  async getLocation(id: string): Promise<Location> {
    const res = await api.get<Location>(`/locations/${id}`);
    return res.data!;
  },

  async createLocation(payload: Partial<Location>): Promise<Location> {
    const res = await api.post<Location>('/locations', payload);
    return res.data!;
  },

  async updateLocation(id: string, payload: Partial<Location>): Promise<Location> {
    const res = await api.put<Location>(`/locations/${id}`, payload);
    return res.data!;
  },

  async deleteLocation(id: string) {
    return await api.delete(`/locations/${id}`);
  },
};
