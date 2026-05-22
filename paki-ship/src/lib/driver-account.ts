import { apiFetch } from "@/lib/api-client";

export type DriverProfile = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
  dob: string | null;
  role: "customer" | "driver" | "operator";
  address: string | null;
  city: string | null;
  province: string | null;
  documents: string[];
  profilePhotoUrl: string | null;
  driverRating?: {
    average: number | null;
    count: number;
  };
  driverStats?: {
    totalDeliveries: number;
    completedJobs: number;
    ratingAverage: number | null;
    ratingCount: number;
    memberSince: string | null;
  };
  driverEarnings?: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  driverDetails?: {
    vehicleType: string | null;
    plateNumber: string | null;
    licenseNumber: string | null;
    bankAccount: string | null;
    emergencyContact: string | null;
    documentsUploaded: {
      license: boolean;
      id: boolean;
      registration: boolean;
    };
    documents: Partial<
      Record<
        "license" | "id" | "registration",
        {
          type: "license" | "id" | "registration";
          fileName: string;
          mimeType: string;
          size: number;
          dataUrl: string;
          uploadedAt: string;
        }
      >
    >;
  };
  createdAt: string | null;
};

export type DriverSettings = {
  userId: string;
  preferences: Record<string, boolean>;
  security: {
    twoFactorEnabled: boolean;
  };
  passwordUpdatedAt: string | null;
  updatedAt: string | null;
};

export type DriverNotification = {
  id: string;
  userId: string;
  type: "delivery" | "system" | "promo";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string | null;
};

function getMessage(result: unknown, fallback: string) {
  if (result && typeof result === "object" && "message" in result) {
    const message = (result as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

export async function fetchDriverProfile() {
  const response = await apiFetch("/api/profile/me");
  const result = await response.json();

  if (!response.ok) {
    throw new Error(getMessage(result, "Unable to load driver profile."));
  }

  return result as { profile: DriverProfile };
}

export async function updateDriverProfile(input: Record<string, unknown>) {
  const response = await apiFetch("/api/profile/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(getMessage(result, "Unable to update driver profile."));
  }

  return result as { profile: DriverProfile; message: string };
}

export async function uploadDriverDocument(
  documentType: "license" | "id" | "registration",
  file: File,
) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiFetch(`/api/profile/me/driver-documents/${documentType}`, {
    method: "POST",
    body: formData,
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(getMessage(result, "Unable to upload driver document."));
  }

  return result as {
    profile: DriverProfile;
    document: {
      type: "license" | "id" | "registration";
      fileName: string;
      mimeType: string;
      size: number;
      uploadedAt: string;
    };
    message: string;
  };
}

export async function fetchDriverSettings() {
  const response = await apiFetch("/api/settings/me");
  const result = await response.json();

  if (!response.ok) {
    throw new Error(getMessage(result, "Unable to load driver settings."));
  }

  return result as { settings: DriverSettings };
}

export async function updateDriverSettings(input: {
  preferences?: Record<string, boolean>;
  twoFactorEnabled?: boolean;
}) {
  const response = await apiFetch("/api/settings/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(getMessage(result, "Unable to update driver settings."));
  }

  return result as { settings: DriverSettings; message: string };
}

export async function changeDriverPassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
) {
  const response = await apiFetch("/api/settings/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(getMessage(result, "Unable to update your password."));
  }

  return result as { message: string };
}

export async function fetchDriverNotifications() {
  const response = await apiFetch("/api/notifications");
  const result = await response.json();

  if (!response.ok) {
    throw new Error(getMessage(result, "Unable to load notifications."));
  }

  return result as { notifications: DriverNotification[] };
}

export async function markDriverNotificationAsRead(notificationId: string) {
  const response = await apiFetch(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(getMessage(result, "Unable to update notification."));
  }

  return result as { notificationId: string; message: string };
}

export async function markAllDriverNotificationsAsRead() {
  const response = await apiFetch("/api/notifications/read-all", {
    method: "POST",
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(getMessage(result, "Unable to update notifications."));
  }

  return result as { message: string };
}
