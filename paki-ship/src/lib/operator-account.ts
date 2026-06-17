import { apiFetch } from "@/lib/api-client";

export type OperatorProfile = {
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
  operatorDetails?: {
    documentsUploaded: {
      governmentId: boolean;
      businessPermit: boolean;
    };
    documents: Partial<
      Record<
        "governmentId" | "businessPermit",
        {
          type: "governmentId" | "businessPermit";
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

export type OperatorSettings = {
  userId: string;
  preferences: Record<string, boolean>;
  security: {
    twoFactorEnabled: boolean;
  };
  passwordUpdatedAt: string | null;
  updatedAt: string | null;
};

export type OperatorDropOffPointProfile = {
  id: string;
  name: string;
  address: string;
  status: "Open" | "Busy" | "Closed";
  capacity: "High" | "Medium" | "Full";
  distance: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  updatedAt: string | null;
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

export async function fetchOperatorProfile() {
  const response = await apiFetch("/api/profile/me");
  const result = await response.json();

  if (!response.ok) {
    throw new Error(getMessage(result, "Unable to load operator profile."));
  }

  return result as { profile: OperatorProfile };
}

export async function updateOperatorProfile(input: Record<string, unknown>) {
  const response = await apiFetch("/api/profile/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(getMessage(result, "Unable to update operator profile."));
  }

  return result as { profile: OperatorProfile; message: string };
}

export async function uploadOperatorDocument(
  documentType: "government-id" | "business-permit",
  file: File,
) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiFetch(`/api/profile/me/operator-documents/${documentType}`, {
    method: "POST",
    body: formData,
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(getMessage(result, "Unable to upload operator document."));
  }

  return result as {
    profile: OperatorProfile;
    document: {
      type: "governmentId" | "businessPermit";
      fileName: string;
      mimeType: string;
      size: number;
      uploadedAt: string;
    };
    message: string;
  };
}

export async function fetchOperatorDropOffPointProfile() {
  const response = await apiFetch("/api/operator/dashboard/drop-off-point-profile");
  const result = await response.json();

  if (!response.ok) {
    throw new Error(getMessage(result, "Unable to load drop-off point profile."));
  }

  return result as { dropOffPoint: OperatorDropOffPointProfile | null };
}

export async function updateOperatorDropOffPointProfile(input: {
  name: string;
  address: string;
  status?: OperatorDropOffPointProfile["status"];
  capacity?: OperatorDropOffPointProfile["capacity"];
  distance?: string;
}) {
  const response = await apiFetch("/api/operator/dashboard/drop-off-point-profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(getMessage(result, "Unable to update drop-off point profile."));
  }

  return result as {
    dropOffPoint: OperatorDropOffPointProfile;
    message: string;
  };
}

export async function fetchOperatorSettings() {
  const response = await apiFetch("/api/settings/me");
  const result = await response.json();

  if (!response.ok) {
    throw new Error(getMessage(result, "Unable to load operator settings."));
  }

  return result as { settings: OperatorSettings };
}

export async function updateOperatorSettings(input: {
  preferences?: Record<string, boolean>;
  twoFactorEnabled?: boolean;
}) {
  const response = await apiFetch("/api/settings/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(getMessage(result, "Unable to update operator settings."));
  }

  return result as { settings: OperatorSettings; message: string };
}
