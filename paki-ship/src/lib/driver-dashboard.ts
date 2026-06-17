import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import { apiFetch } from "@/lib/api-client";

export type JobStatus = "available" | "in-progress" | "completed";
export type ParcelStatus = "picked-up" | "out-for-delivery" | "delivered" | null;

export interface DriverJob {
  id: string;
  jobNumber: string;
  pickup: string;
  dropoff: string;
  distance: string;
  earningsAmount: number;
  earnings: string;
  status: JobStatus;
  parcelStatus: ParcelStatus;
  customerName: string;
  packageSize: "Small" | "Medium" | "Large";
  timeLimit?: string;
  customerPhone?: string;
  packageDescription?: string;
  specialInstructions?: string;
  rating?: number | null;
  parcelDraftId?: string | null;
  acceptedAt?: string | null;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DriverDashboardResponse {
  metrics: {
    todaysEarnings: number;
    todaysEarningsLabel: string;
    deliveriesToday: number;
    ratingAverage: number | null;
    onlineSeconds: number;
  };
  presence: {
    isOnline: boolean;
    currentSessionStartedAt: string | null;
    lastSeenAt: string | null;
  };
  jobs: DriverJob[];
  meta: {
    currency: string;
    refreshedAt: string;
    source: string;
    availableJobRadiusKm?: number;
  };
}

export type DriverLocation = {
  lat: number;
  lng: number;
};

let supabaseChannelClient:
  | ReturnType<typeof createClient>
  | null = null;

function getSupabaseChannelClient() {
  if (typeof window === "undefined") return null;
  if (supabaseChannelClient) return supabaseChannelClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  supabaseChannelClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseChannelClient;
}

async function readJsonResponse<T>(response: Response, fallbackMessage: string) {
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || fallbackMessage);
  }

  return result as T;
}

export async function fetchDriverDashboard(location?: DriverLocation | null) {
  const query = location
    ? `?${new URLSearchParams({
        lat: String(location.lat),
        lng: String(location.lng),
      }).toString()}`
    : "";
  const response = await apiFetch(`/api/driver/dashboard${query}`);
  return readJsonResponse<DriverDashboardResponse>(
    response,
    "Unable to load the driver dashboard.",
  );
}

export async function updateDriverAvailability(
  isOnline: boolean,
  location?: DriverLocation | null,
) {
  const response = await apiFetch("/api/driver/dashboard/presence", {
    method: "PATCH",
    body: JSON.stringify({ isOnline, ...location }),
  });

  return readJsonResponse<DriverDashboardResponse>(
    response,
    "Unable to update your availability.",
  );
}

export async function acceptDriverJob(jobId: string) {
  const response = await apiFetch(`/api/driver/dashboard/jobs/${jobId}/accept`, {
    method: "POST",
  });

  return readJsonResponse<DriverDashboardResponse>(
    response,
    "Unable to accept this delivery job.",
  );
}

export async function updateDriverParcelStatus(
  jobId: string,
  parcelStatus: Exclude<ParcelStatus, null>,
  location?: DriverLocation | null,
) {
  const response = await apiFetch(`/api/driver/dashboard/jobs/${jobId}/status`, {
    method: "POST",
    body: JSON.stringify({ parcelStatus, ...location }),
  });

  return readJsonResponse<DriverDashboardResponse>(
    response,
    "Unable to update the parcel status.",
  );
}

export function subscribeToDriverDashboard(
  driverUserId: string | null,
  onInvalidate: () => void,
) {
  const client = getSupabaseChannelClient();
  if (!client || !driverUserId) {
    return () => undefined;
  }

  const channel: RealtimeChannel = client
    .channel(`driver-dashboard:${driverUserId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "driver", table: "driver_jobs" },
      (payload) => {
        const next = payload.new as { driver_id?: string | null; status?: string } | null;
        const previous = payload.old as { driver_id?: string | null; status?: string } | null;
        const affectsDriver =
          next?.driver_id === driverUserId ||
          previous?.driver_id === driverUserId ||
          next?.status === "available" ||
          previous?.status === "available";

        if (affectsDriver) {
          onInvalidate();
        }
      },
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "driver",
        table: "driver_profiles",
        filter: `id=eq.${driverUserId}`,
      },
      () => onInvalidate(),
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
