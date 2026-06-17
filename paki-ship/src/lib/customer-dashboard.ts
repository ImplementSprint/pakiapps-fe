import { apiFetch } from "@/lib/api-client";

export type CustomerAnnouncement = {
  id: string;
  type: "system" | "update" | "promo";
  title: string;
  message: string;
  isPinned: boolean;
};

export type ActiveDelivery = {
  id: string;
  trackingNumber: string;
  from: string;
  to: string;
  status: string;
  rawStatus: string;
  updatedAt: string;
  timeLabel: string;
};

export type CustomerReview = {
  id: string;
  trackingNumber: string;
  rating: number;
  review: string | null;
  tags: string[];
  createdAt: string;
};

export type CustomerPreferences = {
  emailNotifications: boolean;
  smsUpdates: boolean;
  autoExtend: boolean;
};

export async function fetchCustomerAnnouncements() {
  const response = await apiFetch("/api/customer/dashboard/announcements");
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to load announcements.");
  }

  return result as { announcements: CustomerAnnouncement[] };
}

export async function fetchCustomerActiveDeliveries(options?: {
  search?: string;
  status?: string;
}) {
  const params = new URLSearchParams();
  if (options?.search?.trim()) {
    params.set("search", options.search.trim());
  }
  if (options?.status?.trim() && options.status !== "all") {
    params.set("status", options.status.trim());
  }

  const query = params.toString();
  const path = query
    ? `/api/customer/dashboard/active-deliveries?${query}`
    : "/api/customer/dashboard/active-deliveries";

  const response = await apiFetch(path);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to load active deliveries.");
  }

  return result as {
    deliveries: ActiveDelivery[];
    summary: {
      totalActive: number;
      inTransit: number;
      outForDelivery: number;
    };
  };
}

export async function fetchCustomerReviews(limit = 5) {
  const response = await apiFetch(`/api/customer/reviews?limit=${limit}`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to load reviews.");
  }

  return result as { reviews: CustomerReview[] };
}

export async function submitCustomerReview(payload: {
  trackingNumber: string;
  rating: number;
  review?: string;
  tags?: string[];
}) {
  const response = await apiFetch("/api/customer/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to submit review.");
  }

  return result as { review: CustomerReview };
}

export async function fetchCustomerPreferences() {
  const response = await apiFetch("/api/customer/settings/preferences");
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to load preferences.");
  }

  return result as { preferences: CustomerPreferences };
}

export async function updateCustomerPreferences(patch: Partial<CustomerPreferences>) {
  const response = await apiFetch("/api/customer/settings/preferences", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to update preferences.");
  }

  return result as { preferences: CustomerPreferences };
}
