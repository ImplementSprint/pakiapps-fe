import { api } from './api';
import { logsService, TransactionStats, ActivityStats } from './logsService';

export interface DashboardStats {
  totalBookings: number;
  activeUsers: number;
  parkingSpots: number;
  totalLocations: number;
  revenue: number;
}

export const analyticsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await api.get<DashboardStats>('/analytics/dashboard');
    return res.data!;
  },

  async getRevenueData() {
    const res = await api.get('/analytics/revenue');
    return res.data!;
  },

  async getOccupancyData() {
    const res = await api.get('/analytics/occupancy');
    return res.data!;
  },

  async getVehicleTypeDistribution() {
    const res = await api.get('/analytics/vehicle-types');
    return res.data!;
  },

  async getPaymentMethodDistribution() {
    const res = await api.get('/analytics/payment-methods');
    return res.data!;
  },

  // ── Log-derived analytics (delegates to logsService) ─────────────────────
  async getTransactionStats(): Promise<TransactionStats> {
    return logsService.getTransactionStats();
  },

  async getActivityStats(): Promise<ActivityStats> {
    return logsService.getActivityStats();
  },
};