import { api } from '../lib/api';

export interface AppNotification {
  _id: string;
  id: number;
  userId: number;
  type:
    | 'booking_confirmed'
    | 'booking_cancelled'
    | 'booking_reminder'
    | 'no_show'
    | 'discount_approved'
    | 'discount_rejected'
    | 'registration_rejected'
    | 'system';
  title: string;
  body: string;
  isRead: boolean;
  entityType?: string | null;
  entityId?: number | null;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  total: number;
  page: number;
  totalPages: number;
  unreadCount: number;
}

export const notificationService = {
  async getAll(page = 1): Promise<NotificationsResponse> {
    const res = await api.get(`/notifications?page=${page}&limit=20`);
    return (res.data as NotificationsResponse) ?? { notifications: [], total: 0, page: 1, totalPages: 1, unreadCount: 0 };
  },

  async getUnreadCount(): Promise<number> {
    const res = await api.get('/notifications/unread-count');
    return (res.data as { count: number })?.count ?? 0;
  },

  async markOneRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },

  async deleteOne(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },

  async clearAll(): Promise<void> {
    await api.delete('/notifications');
  },
};
