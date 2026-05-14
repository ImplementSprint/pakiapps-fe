import { api } from './authService';

export interface DaySchedule {
  dayOfWeek: number;   // 0=Sun … 6=Sat
  dayName: string;
  openTime: string;    // "06:00"
  closeTime: string;   // "23:00"
  isClosed: boolean;
}

const operatingHoursService = {
  /** Get the 7-day schedule for a location */
  getByLocation: async (locationId: string | number): Promise<DaySchedule[]> => {
    const res = await api.get(`/operating-hours/${locationId}`);
    return res.data.data ?? [];
  },

  /** Update / upsert the schedule for a location (partner / admin) */
  upsert: async (locationId: string | number, schedule: Omit<DaySchedule, 'dayName'>[]): Promise<DaySchedule[]> => {
    const res = await api.put(`/operating-hours/${locationId}`, { schedule });
    return res.data.data ?? [];
  },
};

export { operatingHoursService };
