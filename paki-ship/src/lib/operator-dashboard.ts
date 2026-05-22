import { apiFetch } from "@/lib/api-client";

export type OperatorDashboardResponse = {
  kpis: {
    incomingToday: number;
    currentlyStored: number;
    pickedUpToday: number;
    customersServed: number;
  };
  earnings: {
    totalEarned: number;
    weeklyIncrease: number;
    incentives: number;
    bonusesEarned: number;
  };
  meta: {
    currency: string;
    timeframe: string;
    derivedFrom: string;
  };
};

export type OperatorManualEntryResponse = {
  parcel: {
    id: string;
    trackingNumber: string;
    sender: string;
    recipient: string;
    status: "incoming" | "stored" | "picked-up" | "dispatched";
    arrivalTime?: string;
    storageLocation?: string | null;
  };
};

export type OperatorParcel = {
  id: string;
  trackingNumber: string;
  sender: string;
  recipient: string;
  status: "incoming" | "stored" | "picked-up" | "dispatched";
  arrivalTime?: string;
  pickupTime?: string;
  storageLocation?: string | null;
  progressLabel?: string | null;
  progressPercentage?: number;
  currentLocation?: string | null;
};

export type OperatorParcelsResponse = {
  parcels: OperatorParcel[];
  meta: {
    hubId: string;
  };
};

export type OperatorReportsResponse = {
  reports: Array<{
    id: string;
    trackingNumber: string;
    status: string;
    details: string;
    reportedAt?: string | null;
  }>;
  meta: {
    hubId: string;
  };
};

export type OperatorRelayBooking = {
  draftId: string;
  trackingNumber?: string | null;
  qrCodePayload: string;
  receiverName?: string | null;
  status?: string | null;
  serviceId?: string | null;
  deliveryMode?: string | null;
  totalParcels: number;
  createdAt?: string | null;
};

export type OperatorRelayBookingsResponse = {
  bookings: OperatorRelayBooking[];
  meta: {
    hubId: string | null;
    matchedBy: string;
  };
};

export type OperatorNotification = {
  id: string;
  userId: string;
  type: "delivery" | "system" | "promo";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string | null;
};

export async function fetchOperatorDashboard() {
  const response = await apiFetch("/api/operator/dashboard");
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to load operator dashboard.");
  }

  return result as OperatorDashboardResponse;
}

export async function fetchOperatorNotifications() {
  const response = await apiFetch("/api/notifications");
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to load operator notifications.");
  }

  return result as { notifications: OperatorNotification[]; unreadCount: number };
}

export async function markOperatorNotificationAsRead(notificationId: string) {
  const response = await apiFetch(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to update notification.");
  }

  return result;
}

export async function markAllOperatorNotificationsAsRead() {
  const response = await apiFetch("/api/notifications/read-all", {
    method: "POST",
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to update notifications.");
  }

  return result;
}

export async function submitOperatorManualEntry(trackingNumber: string) {
  const response = await apiFetch("/api/operator/dashboard/manual-entry", {
    method: "POST",
    body: JSON.stringify({ trackingNumber }),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to register this parcel right now.");
  }

  return result as OperatorManualEntryResponse;
}

export async function fetchOperatorParcels() {
  const response = await apiFetch("/api/operator/dashboard/parcels");
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to load operator parcels.");
  }

  return result as OperatorParcelsResponse;
}

export async function updateOperatorParcelStatus(
  recordId: string,
  status: OperatorParcel["status"],
) {
  const response = await apiFetch(`/api/operator/dashboard/parcel-records/${recordId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to update parcel status.");
  }

  return result as { parcel: OperatorParcel };
}

export async function submitLostParcelReport(trackingNumber: string, details: string) {
  const response = await apiFetch("/api/operator/dashboard/reports/lost-parcel", {
    method: "POST",
    body: JSON.stringify({ trackingNumber, details }),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to submit the lost parcel report.");
  }

  return result as {
    report: {
      id: string;
      trackingNumber: string;
      details: string;
      status: string;
    };
  };
}

export async function fetchOperatorReports() {
  const response = await apiFetch("/api/operator/dashboard/reports");
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to load operator reports.");
  }

  return result as OperatorReportsResponse;
}

export async function fetchOperatorRelayBookings() {
  const response = await apiFetch("/api/operator/dashboard/relay-bookings");
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to load relay booking QR codes.");
  }

  return result as OperatorRelayBookingsResponse;
}
