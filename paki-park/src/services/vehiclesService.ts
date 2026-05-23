import { api } from '../lib/api';

export interface Vehicle {
  _id: string;
  id?: number | string;
  brand: string;
  model: string;
  color: string;
  plateNumber: string;
  type: string;
  isDefault: boolean;
  orDoc?: string | null;
  crDoc?: string | null;
}

function normalise(v: any): Vehicle {
  return { ...v, _id: v._id ?? String(v.id), isDefault: v.isDefault ?? false };
}

export const vehiclesService = {
  async getMyVehicles(): Promise<Vehicle[]> {
    const res = await api.get('/vehicles');
    const raw: any[] = Array.isArray(res.data) ? res.data : [];
    return raw.map(normalise);
  },

  async addVehicle(data: Omit<Vehicle, '_id' | 'id'>): Promise<Vehicle> {
    const res = await api.post('/vehicles', data);
    return normalise(res.data ?? {});
  },

  async updateVehicle(id: string, data: Partial<Omit<Vehicle, '_id' | 'id'>>): Promise<Vehicle> {
    const res = await api.put(`/vehicles/${id}`, data);
    return normalise(res.data ?? {});
  },

  async deleteVehicle(id: string) {
    const res = await api.delete(`/vehicles/${id}`);
    return res.data;
  },

  async setDefault(id: string): Promise<Vehicle> {
    const res = await api.patch(`/vehicles/${id}/default`);
    return normalise(res.data ?? {});
  },
};
