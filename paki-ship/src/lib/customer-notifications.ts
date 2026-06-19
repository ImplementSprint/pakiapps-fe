import { apiFetch } from "@/lib/api-client";
import type { Notification } from "@/features/components/NotificationDropdown";

type NotificationResponse = {
  notifications: Notification[];
};

export async function fetchCustomerNotifications() {
  const response = await apiFetch("/api/customer/notifications");
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to load notifications.");
  }

  return result as NotificationResponse;
}

export async function markCustomerNotificationAsRead(notificationId: string) {
  const response = await apiFetch(`/api/customer/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to update notification.");
  }

  return result as { notificationId: string };
}

export async function markAllCustomerNotificationsAsRead() {
  const response = await apiFetch("/api/customer/notifications/read-all", {
    method: "PATCH",
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to update notifications.");
  }

  return result as { success: boolean };
}

export async function clearAllCustomerNotifications() {
  const response = await apiFetch("/api/customer/notifications", {
    method: "DELETE",
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to clear notifications.");
  }

  return result as { success: boolean };
}
