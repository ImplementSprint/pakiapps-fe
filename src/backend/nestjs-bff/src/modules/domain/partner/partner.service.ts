import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../shared/supabase/supabase.service';
import { SharedAuthService } from '../../shared/auth/shared-auth.service';

/**
 * Domain service — partner schema
 * Owns: reviews, activity_logs
 * Cross-schema: resolves user_id → name via SharedAuthService (internal API call)
 */
@Injectable()
export class PartnerService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly sharedAuth: SharedAuthService,
  ) {}

  // ── Reviews ───────────────────────────────────────────────────────────────

  async createReview(data: {
    bookingId: string;
    userId: string;
    locationId: string;
    rating: number;
    comment?: string;
  }) {
    const { data: review, error } = await this.supabase.client
      .schema('partner')
      .from('reviews')
      .insert(data)
      .select('id, createdAt')
      .single();
    if (error) throw new Error(error.message);
    return { reviewId: review.id, createdAt: review.createdAt };
  }

  async getReviewByBooking(bookingId: string, userId: string) {
    const { data, error } = await this.supabase.client
      .schema('partner')
      .from('reviews')
      .select('*')
      .eq('bookingId', bookingId)
      .eq('userId', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async getLocationReviews(locationId: string, pagination: { page: number; limit: number }) {
    const { data, error } = await this.supabase.client
      .schema('partner')
      .from('reviews')
      .select('id, rating, comment, userId, createdAt')
      .eq('locationId', locationId)
      .order('createdAt', { ascending: false })
      .range(
        (pagination.page - 1) * pagination.limit,
        pagination.page * pagination.limit - 1,
      );
    if (error) throw new Error(error.message);

    // Resolve userId → userName via shared-service internal API call
    const resolved = await Promise.all(
      (data ?? []).map(async (r: any) => {
        const profile = await this.sharedAuth.getUserSummary(r.userId).catch(() => null);
        return { ...r, userName: profile?.name ?? null };
      }),
    );
    return resolved;
  }

  async getPartnerLocationReviews(locationId: string, partnerId: string) {
    const { data, error } = await this.supabase.client
      .schema('partner')
      .from('reviews')
      .select('id, rating, comment, userId, createdAt')
      .eq('locationId', locationId)
      .order('createdAt', { ascending: false });
    if (error) throw new Error(error.message);

    const resolved = await Promise.all(
      (data ?? []).map(async (r: any) => {
        const profile = await this.sharedAuth.getUserSummary(r.userId).catch(() => null);
        return { ...r, userName: profile?.name ?? null };
      }),
    );
    return resolved;
  }

  // ── Activity Logs ─────────────────────────────────────────────────────────

  async getActivityLogs(filters: { targetType?: string; page: number; limit: number }) {
    let query = this.supabase.client
      .schema('partner')
      .from('activity_logs')
      .select('id, adminId, action, targetType, targetId, details, createdAt')
      .order('createdAt', { ascending: false })
      .range(
        (filters.page - 1) * filters.limit,
        filters.page * filters.limit - 1,
      );

    if (filters.targetType) {
      query = query.eq('targetType', filters.targetType);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // Resolve adminId → display name via shared-service
    const resolved = await Promise.all(
      (data ?? []).map(async (log: any) => {
        const profile = await this.sharedAuth.getUserSummary(log.adminId).catch(() => null);
        return { ...log, adminName: profile?.name ?? null };
      }),
    );
    return resolved;
  }
}
