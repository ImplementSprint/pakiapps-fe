import { api } from '../lib/api';

export const analyticsService = {
  async getDashboardStats() {
    const res = await api.get('/analytics/overview');
    return res.data;
  },
  async getOverview(params?: { locationId?: string; startDate?: string; endDate?: string }) {
    const q = new URLSearchParams();
    if (params?.locationId) q.set('locationId', params.locationId);
    if (params?.startDate)  q.set('startDate', params.startDate);
    if (params?.endDate)    q.set('endDate', params.endDate);
    const res = await api.get(`/analytics/overview?${q.toString()}`);
    return res.data;
  },
};
