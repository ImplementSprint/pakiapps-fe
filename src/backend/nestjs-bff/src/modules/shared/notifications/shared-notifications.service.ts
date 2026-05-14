import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Shared-service notifications write client.
 * pakipark-service NEVER writes to notifications schema directly.
 * Read endpoints (GET /pakipark/web/notifications) also call shared-service.
 */
@Injectable()
export class SharedNotificationsService {
  private readonly logger = new Logger(SharedNotificationsService.name);
  private readonly baseUrl = process.env.SHARED_SERVICE_URL ?? 'http://shared-service:3000';
  private readonly serviceKey = process.env.INTERNAL_SERVICE_KEY ?? '';

  constructor(private readonly http: HttpService) {}

  private get headers() {
    return { 'X-Service-Key': this.serviceKey };
  }

  // ── Read (pass-through for web/mobile BFF) ────────────────────────────────

  async getForUser(userId: string) {
    const res = await firstValueFrom(
      this.http.get(`${this.baseUrl}/notifications`, {
        headers: this.headers,
        params: { userId },
      }),
    );
    return res.data as Array<{ id: string; type: string; title: string; message: string; time: string; isRead: boolean }>;
  }

  async markOneRead(notificationId: string, userId: string) {
    const res = await firstValueFrom(
      this.http.patch(
        `${this.baseUrl}/notifications/${notificationId}/read`,
        { userId },
        { headers: this.headers },
      ),
    );
    return res.data;
  }

  async markAllRead(userId: string) {
    const res = await firstValueFrom(
      this.http.patch(`${this.baseUrl}/notifications/read-all`, { userId }, { headers: this.headers }),
    );
    return res.data;
  }

  // ── Write (triggered by pakipark-service domain events) ───────────────────

  async send(data: {
    userId: string;
    type: 'parking' | 'system' | 'promo';
    title: string;
    message: string;
    metadata?: Record<string, any> | null;
  }) {
    const res = await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/notifications`,
        { ...data, sourceService: 'pakipark' },
        { headers: this.headers },
      ),
    );
    return res.data as { notificationId: string; createdAt: string };
  }

  async sendBulk(data: {
    userIds: string[];
    type: 'system' | 'promo';
    title: string;
    message: string;
  }) {
    const res = await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/notifications/bulk`,
        { ...data, sourceService: 'pakipark' },
        { headers: this.headers },
      ),
    );
    return res.data as { sent: number; failed: number };
  }

  async sendAnnouncement(data: {
    title: string;
    message: string;
    targetRole: 'all' | 'customer' | 'partner' | 'teller';
    expiresAt?: string | null;
    createdBy: string;
  }) {
    const res = await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/announcements`,
        { ...data, targetService: 'pakipark' },
        { headers: this.headers },
      ),
    );
    return res.data as { announcementId: string };
  }
}
