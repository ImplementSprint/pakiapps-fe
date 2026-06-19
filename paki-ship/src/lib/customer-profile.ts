import { apiFetch } from "@/lib/api-client";

async function readApiResult(response: Response) {
  const raw = await response.text();

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { message: raw };
  }
}

function getApiErrorMessage(
  result: Record<string, unknown>,
  fallback: string,
) {
  const message = result.message;

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  if (Array.isArray(message) && message.length > 0) {
    return message.map((item) => String(item)).join(", ");
  }

  if (typeof result.error === "string" && result.error.trim()) {
    return result.error;
  }

  return fallback;
}

export type CustomerProfile = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
  city?: string;
  province?: string;
  profilePicture: string | null;
  preferences: {
    emailNotifications: boolean;
    smsUpdates: boolean;
    autoExtend: boolean;
  };
  discountIdUploaded: boolean;
  discountIdType?: string | null;
  discountIdStatus?: "not_uploaded" | "pending" | "verified" | "rejected";
  discountIdFileUrl?: string | null;
  discountIdSubmittedAt?: string | null;
  discountIdVerifiedAt?: string | null;
  twoFactorEnabled?: boolean;
  passwordUpdatedAt?: string | null;
};

export type CustomerProfileResponse = {
  profile: CustomerProfile;
  stats: {
    totalBookings: number;
    activeBookings: number;
    savedVehicles: number;
    accountCreated: string;
  };
  activity: Array<{
    id: string;
    type: string;
    title: string;
    description?: string | null;
    createdAt: string;
    timeLabel: string;
  }>;
};

export type SavedRecipient = {
  id: string;
  name: string;
  phone: string;
  address: string;
  initial: string;
  frequency: number;
  lastUsed: string;
  createdAt?: string | null;
};

export async function fetchCustomerProfile() {
  const response = await apiFetch("/api/customer/profile");
  const result = await readApiResult(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(result, "Unable to load customer profile."));
  }

  return result as CustomerProfileResponse;
}

export async function updateCustomerProfile(payload: Partial<CustomerProfile>) {
  const response = await apiFetch("/api/customer/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const result = await readApiResult(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(result, "Unable to update customer profile."));
  }

  return result as CustomerProfileResponse;
}

export async function fetchSavedRecipients() {
  const response = await apiFetch("/api/customer/profile/recipients");
  const result = await readApiResult(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(result, "Unable to load saved recipients."));
  }

  return result as { recipients: SavedRecipient[] };
}

export async function quickSaveRecipient(payload: { name: string; phone: string }) {
  const response = await apiFetch("/api/customer/profile/recipients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const result = await readApiResult(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(result, "Unable to save this recipient."));
  }

  return result as {
    recipient: SavedRecipient;
    alreadySaved: boolean;
  };
}

export async function uploadCustomerProfilePicture(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiFetch("/api/customer/profile/upload-avatar", {
    method: "POST",
    body: formData,
  });
  const result = await readApiResult(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(result, "Unable to upload your profile photo."));
  }

  return result as { profilePicture: string };
}

export async function uploadCustomerDiscountId(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiFetch("/api/customer/profile/upload-discount-id", {
    method: "POST",
    body: formData,
  });
  const result = await readApiResult(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(result, "Unable to upload your ID right now."));
  }

  return result as {
    discountIdUploaded: boolean;
    discountIdStatus: "pending";
    discountIdType: string;
    discountIdFileUrl: string;
    discountIdSubmittedAt: string;
  };
}

export async function changeCustomerPassword(currentPassword: string, newPassword: string) {
  const response = await apiFetch("/api/customer/profile/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const result = await readApiResult(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(result, "Unable to update your password."));
  }

  return result as CustomerProfileResponse;
}

export async function setupCustomerTwoFactor() {
  const response = await apiFetch("/api/customer/profile/two-factor/setup", {
    method: "POST",
  });
  const result = await readApiResult(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(result, "Unable to start two-factor setup."));
  }

  return result as {
    secret?: string;
    otpauthUri?: string;
    twoFactorEnabled: boolean;
  };
}

export async function enableCustomerTwoFactor(code: string) {
  const response = await apiFetch("/api/customer/profile/two-factor/enable", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  const result = await readApiResult(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(result, "Unable to enable two-factor authentication."));
  }

  return result as CustomerProfileResponse;
}

export async function disableCustomerTwoFactor(code: string) {
  const response = await apiFetch("/api/customer/profile/two-factor/disable", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  const result = await readApiResult(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(result, "Unable to disable two-factor authentication."));
  }

  return result as CustomerProfileResponse;
}

export function syncCustomerProfileToStorage(profile: CustomerProfile) {
  localStorage.setItem("userName", profile.fullName);
  localStorage.setItem("userFirstName", profile.firstName);
  localStorage.setItem("userLastName", profile.lastName);
  localStorage.setItem("userEmail", profile.email);
  localStorage.setItem("userPhone", profile.phone);
  localStorage.setItem("userAddress", profile.address);
  localStorage.setItem("userDOB", profile.dob || "");
  localStorage.setItem("customerProfilePicture", profile.profilePicture || "");
  localStorage.setItem(
    "emailNotifications",
    String(profile.preferences.emailNotifications),
  );
  localStorage.setItem("smsUpdates", String(profile.preferences.smsUpdates));
  localStorage.setItem("autoExtend", String(profile.preferences.autoExtend));
  localStorage.setItem(
    "discountIdUploaded",
    String(profile.discountIdUploaded),
  );
  localStorage.setItem(
    "twoFactorEnabled",
    String(Boolean(profile.twoFactorEnabled)),
  );
  localStorage.setItem(
    "passwordUpdatedAt",
    profile.passwordUpdatedAt || "",
  );
  window.dispatchEvent(new Event("storage"));
}
