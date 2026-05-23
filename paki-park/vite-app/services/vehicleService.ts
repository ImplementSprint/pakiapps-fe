import { api } from './api';

export interface Vehicle {
  _id: string;
  brand: string;
  model: string;
  color: string;
  plateNumber: string;
  type: string;
  orDoc?: string | null;
  crDoc?: string | null;
}

export interface VehiclePayload {
  brand: string;
  model: string;
  color: string;
  plateNumber: string;
  type: string;
  orDoc?: string | null;
  crDoc?: string | null;
}

export const vehicleService = {
  async getMyVehicles(): Promise<Vehicle[]> {
    const res = await api.get<Vehicle[]>('/vehicles');
    return res.data!;
  },

  async addVehicle(payload: VehiclePayload): Promise<Vehicle> {
    const res = await api.post<Vehicle>('/vehicles', payload);
    return res.data!;
  },

  async updateVehicle(id: string, payload: VehiclePayload): Promise<Vehicle> {
    const res = await api.put<Vehicle>(`/vehicles/${id}`, payload);
    return res.data!;
  },

  async deleteVehicle(id: string) {
    return await api.delete(`/vehicles/${id}`);
  },
};
