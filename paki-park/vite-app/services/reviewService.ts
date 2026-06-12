import { api } from './api';

export interface Review {
  _id: string;
  rating: number;
  comment: string;
  userId?: { _id: string; name: string; profilePicture?: string };
  locationId?: { _id: string; name: string };
  createdAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  twoStars: number;
  oneStar: number;
}

export interface CreateReviewPayload {
  rating: number;
  comment: string;
  locationId?: string;
}

export const reviewService = {
  async createReview(payload: CreateReviewPayload): Promise<Review> {
    const res = await api.post<Review>('/reviews', payload);
    return res.data!;
  },

  async getReviews(params?: { locationId?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.locationId) query.set('locationId', params.locationId);
    if (params?.page)       query.set('page',       String(params.page));
    if (params?.limit)      query.set('limit',      String(params.limit));
    const res = await api.get<{ reviews: Review[]; total: number; page: number; totalPages: number }>(
      `/reviews?${query.toString()}`
    );
    return res.data!;
  },

  async getReviewStats(): Promise<ReviewStats> {
    const res = await api.get<ReviewStats>('/reviews/stats');
    return res.data!;
  },
};
