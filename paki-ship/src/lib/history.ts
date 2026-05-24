import { apiFetch } from "@/lib/api-client";

export type HistoryTransaction = {
  id: string;
  draftId: string;
  trackingNumber?: string | null;
  date: string;
  createdAt: string;
  from: string;
  to: string;
  status: string;
  rawStatus: string;
  type: string;
  isLive: boolean;
  bucket: "active" | "completed";
  amount: string | null;
  distance?: string | null;
  duration?: string | null;
  totalParcels: number;
};

export type HistoryDetailsResponse = {
  transaction: HistoryTransaction;
  details: {
    sender: {
      name: string;
      phone: string;
      address: string;
    };
    receiver: {
      name: string;
      phone: string;
      address: string;
    };
    parcel: {
      weight: string;
      dimensions: string;
      description: string;
      specialInstructions: string;
      totalParcels: number;
    };
    payment?: {
      deliveryFee: string | null;
      totalAmount: string | null;
      method: string;
      responsibility: string | null;
      serviceId: string | null;
    };
    driver: {
      name: string;
      phone: string;
      vehicle: string;
      rating: number | null;
    } | null;
    timeline: Array<{
      status: string;
      time: string;
      location: string;
      completed: boolean;
    }>;
  };
};

export async function fetchCustomerHistory() {
  const response = await apiFetch("/api/parcel-drafts/history");
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to load parcel history.");
  }

  return result as { transactions: HistoryTransaction[] };
}

export async function fetchCustomerHistoryDetails(trackingNumber: string) {
  const response = await apiFetch(
    `/api/parcel-drafts/history/${encodeURIComponent(trackingNumber)}`,
  );
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to load parcel details.");
  }

  return result as HistoryDetailsResponse;
}
