import { apiFetch } from "@/lib/api-client";

export async function changeAccountPassword(currentPassword: string, newPassword: string) {
  const response = await apiFetch("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to update your password.");
  }

  return result as {
    success: boolean;
    passwordUpdatedAt: string;
  };
}

export async function setupAccountTwoFactor() {
  const response = await apiFetch("/api/auth/two-factor/setup", {
    method: "POST",
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to start two-factor setup.");
  }

  return result as {
    secret?: string;
    otpauthUri?: string;
    twoFactorEnabled: boolean;
  };
}

export async function enableAccountTwoFactor(code: string) {
  const response = await apiFetch("/api/auth/two-factor/enable", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to enable two-factor authentication.");
  }

  return result as {
    success: boolean;
    twoFactorEnabled: boolean;
  };
}

export async function disableAccountTwoFactor(code: string) {
  const response = await apiFetch("/api/auth/two-factor/disable", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to disable two-factor authentication.");
  }

  return result as {
    success: boolean;
    twoFactorEnabled: boolean;
  };
}
