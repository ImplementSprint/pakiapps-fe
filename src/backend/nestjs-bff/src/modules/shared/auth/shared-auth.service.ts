import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Shared-service auth client.
 * All calls use X-Service-Key header — never exposed to clients.
 * Base URL: http://shared-service:3000 (configurable via SHARED_SERVICE_URL)
 *
 * Until shared-service is live, methods return mock data (see TODO comments).
 */
@Injectable()
export class SharedAuthService {
  private readonly logger = new Logger(SharedAuthService.name);
  private readonly baseUrl = process.env.SHARED_SERVICE_URL ?? 'http://shared-service:3000';
  private readonly serviceKey = process.env.INTERNAL_SERVICE_KEY ?? '';

  constructor(private readonly http: HttpService) {}

  private get headers() {
    return { 'X-Service-Key': this.serviceKey };
  }

  // ── Registration ──────────────────────────────────────────────────────────

  async register(data: {
    fullName: string;
    email: string;
    phone: string;
    dob?: string | null;
    role: string;
    address?: string | null;
    city?: string | null;
    province?: string | null;
  }) {
    try {
      const res = await firstValueFrom(
        this.http.post(`${this.baseUrl}/auth/register`, data, { headers: this.headers }),
      );
      return res.data;
    } catch (err) {
      this.logger.error('shared-service /auth/register failed', err?.message);
      throw err;
    }
  }

  async verifyOtp(profileId: string, otp: string) {
    const res = await firstValueFrom(
      this.http.post(`${this.baseUrl}/auth/verify-otp`, { profileId, otp }, { headers: this.headers }),
    );
    return res.data;
  }

  async resendOtp(profileId: string, channel: 'email' | 'sms') {
    const res = await firstValueFrom(
      this.http.post(`${this.baseUrl}/auth/resend-otp`, { profileId, channel }, { headers: this.headers }),
    );
    return res.data;
  }

  // ── Login / Session ───────────────────────────────────────────────────────

  async login(email: string, password: string) {
    const res = await firstValueFrom(
      this.http.post(`${this.baseUrl}/auth/login`, { email, password }, { headers: this.headers }),
    );
    return res.data;
  }

  async refresh(refreshToken: string) {
    try {
      const res = await firstValueFrom(
        this.http.post(`${this.baseUrl}/auth/refresh`, { refreshToken }, { headers: this.headers }),
      );
      return res.data;
    } catch {
      throw new UnauthorizedException({ error: 'refresh_token_invalid' });
    }
  }

  async logout(refreshToken: string) {
    const res = await firstValueFrom(
      this.http.post(`${this.baseUrl}/auth/logout`, { refreshToken }, { headers: this.headers }),
    );
    return res.data;
  }

  // ── Password Reset ────────────────────────────────────────────────────────

  async forgotPassword(email: string) {
    const res = await firstValueFrom(
      this.http.post(`${this.baseUrl}/auth/forgot-password`, { email }, { headers: this.headers }),
    );
    return res.data;
  }

  async resetPassword(token: string, newPassword: string) {
    const res = await firstValueFrom(
      this.http.post(`${this.baseUrl}/auth/reset-password`, { token, newPassword }, { headers: this.headers }),
    );
    return res.data;
  }

  // ── Profile + Internal Summary ────────────────────────────────────────────

  async getProfile(profileId: string) {
    const res = await firstValueFrom(
      this.http.get(`${this.baseUrl}/auth/profile/${profileId}`, { headers: this.headers }),
    );
    return res.data;
  }

  /**
   * GET /internal/auth/:userId/summary
   * Used by reviews, activity_logs, teller vehicle verify to resolve userId → name.
   * If call fails, callers should return raw userId and userName: null.
   */
  async getUserSummary(userId: string): Promise<{ userId: string; name: string; email: string; phone: string; role: string } | null> {
    try {
      const res = await firstValueFrom(
        this.http.get(`${this.baseUrl}/internal/auth/${userId}/summary`, { headers: this.headers }),
      );
      return res.data;
    } catch (err) {
      this.logger.warn(`getUserSummary failed for userId=${userId}: ${err?.message}`);
      return null;
    }
  }

  /**
   * GET /auth/validate
   * Called ONLY for sensitive operations — not on every request.
   * Standard guards use local JWT signature validation.
   */
  async validateToken(jwt: string): Promise<{ profileId: string; role: string; isVerified: boolean }> {
    const res = await firstValueFrom(
      this.http.get(`${this.baseUrl}/auth/validate`, {
        headers: { ...this.headers, Authorization: `Bearer ${jwt}` },
      }),
    );
    return res.data;
  }
}
