import { apiFetch } from "@/lib/api-client";

export type CustomerReview = {
  reviewId: string;
  trackingNumber: string;
  rating: number;
  review: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export async function getMyReviews(): Promise<CustomerReview[]> {
  const response = await apiFetch("/api/customer/feedback/my-reviews");
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to fetch your reviews.");
  }

  return result as CustomerReview[];
}

export type SubmitCustomerFeedbackInput = {
  trackingNumber: string;
  rating: number;
  review?: string;
  tags?: string[];
};

export async function submitCustomerFeedback(input: SubmitCustomerFeedbackInput) {
  const response = await apiFetch("/api/customer/feedback", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to submit parcel feedback.");
  }

  return result as {
    message: string;
    reviewId: string;
    trackingNumber: string;
    rating: number;
    review: string | null;
    tags: string[];
  };
}
