import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getStoredUserIdentity } from "@/lib/client-auth";
import {
  acceptDriverJob,
  fetchDriverDashboard,
  subscribeToDriverDashboard,
  updateDriverAvailability,
  updateDriverParcelStatus,
  type DriverDashboardResponse,
  type DriverJob,
  type DriverLocation,
  type JobStatus,
  type ParcelStatus,
} from "@/lib/driver-dashboard";
import { apiFetch } from "@/lib/api-client";

export type Job = DriverJob;
export type { JobStatus, ParcelStatus };

type JobsContextType = {
  jobs: Job[];
  metrics: DriverDashboardResponse["metrics"];
  isOnline: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  isMutating: boolean;
  hasLoaded: boolean;
  error: string | null;
  refreshDashboard: (options?: { silent?: boolean }) => Promise<void>;
  setOnlineStatus: (value: boolean) => Promise<void>;
  acceptJob: (jobId: string) => Promise<void>;
  updateJobStatus: (jobId: string, newStatus: JobStatus) => Promise<void>;
  updateParcelStatus: (
    jobId: string,
    parcelStatus: Exclude<ParcelStatus, null>,
  ) => Promise<void>;
};

const EMPTY_METRICS: DriverDashboardResponse["metrics"] = {
  todaysEarnings: 0,
  todaysEarningsLabel: "PHP 0",
  deliveriesToday: 0,
  ratingAverage: null,
  onlineSeconds: 0,
};

const JobsContext = createContext<JobsContextType | null>(null);

async function getSessionRole() {
  const response = await apiFetch("/api/auth/session");
  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.authenticated) {
    return null;
  }

  const role = result.user?.role;
  return role === "driver" || role === "customer" || role === "operator" ? role : null;
}

export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [metrics, setMetrics] = useState<DriverDashboardResponse["metrics"]>(EMPTY_METRICS);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const refreshInFlightRef = useRef<Promise<void> | null>(null);

  const applySnapshot = useCallback((snapshot: DriverDashboardResponse) => {
    if (!isMountedRef.current) return;
    setJobs(snapshot.jobs);
    setMetrics(snapshot.metrics);
    setIsOnline(snapshot.presence.isOnline);
    setError(null);
    setHasLoaded(true);
  }, []);

  const refreshDashboard = useCallback(
    async (options?: { silent?: boolean }) => {
      if (refreshInFlightRef.current) {
        return refreshInFlightRef.current;
      }

      const request = (async () => {
        const silent = Boolean(options?.silent);

        if (!silent && !hasLoaded) {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }

        try {
          const sessionRole = await getSessionRole();
          if (sessionRole !== "driver") {
            if (isMountedRef.current) {
              setJobs([]);
              setMetrics(EMPTY_METRICS);
              setIsOnline(false);
              setError("Please log in as a driver to view the driver dashboard.");
              setHasLoaded(true);
            }
            return;
          }

          const snapshot = await fetchDriverDashboard(driverLocation);
          applySnapshot(snapshot);
        } catch (loadError) {
          if (isMountedRef.current) {
            setError(
              loadError instanceof Error
                ? loadError.message
                : "Unable to load the driver dashboard.",
            );
            setHasLoaded(true);
          }
        } finally {
          if (isMountedRef.current) {
            setIsLoading(false);
            setIsRefreshing(false);
          }
          refreshInFlightRef.current = null;
        }
      })();

      refreshInFlightRef.current = request;
      return request;
    },
    [applySnapshot, driverLocation, hasLoaded],
  );

  const runMutation = useCallback(
    async (action: () => Promise<DriverDashboardResponse>) => {
      setIsMutating(true);
      try {
        const snapshot = await action();
        applySnapshot(snapshot);
      } catch (mutationError) {
        const message =
          mutationError instanceof Error
            ? mutationError.message
            : "Unable to save the driver update.";
        if (isMountedRef.current) {
          setError(message);
        }
        throw mutationError;
      } finally {
        if (isMountedRef.current) {
          setIsMutating(false);
        }
      }
    },
    [applySnapshot],
  );

  const setOnlineStatus = useCallback(
    async (value: boolean) => {
      await runMutation(() => updateDriverAvailability(value, driverLocation));
    },
    [driverLocation, runMutation],
  );

  const acceptJob = useCallback(
    async (jobId: string) => {
      await runMutation(() => acceptDriverJob(jobId));
    },
    [runMutation],
  );

  const updateJobStatus = useCallback(
    async (jobId: string, newStatus: JobStatus) => {
      if (newStatus === "in-progress") {
        await acceptJob(jobId);
        return;
      }

      if (newStatus === "completed") {
        await runMutation(() => updateDriverParcelStatus(jobId, "delivered", driverLocation));
        return;
      }

      await refreshDashboard({ silent: true });
    },
    [acceptJob, driverLocation, refreshDashboard, runMutation],
  );

  const updateParcelStatus = useCallback(
    async (jobId: string, parcelStatus: Exclude<ParcelStatus, null>) => {
      await runMutation(() => updateDriverParcelStatus(jobId, parcelStatus, driverLocation));
    },
    [driverLocation, runMutation],
  );

  useEffect(() => {
    if (
      typeof navigator === "undefined" ||
      !navigator.geolocation ||
      getStoredUserIdentity().userRole !== "driver"
    ) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setDriverLocation((current) => {
          if (
            current &&
            Math.abs(current.lat - nextLocation.lat) < 0.00001 &&
            Math.abs(current.lng - nextLocation.lng) < 0.00001
          ) {
            return current;
          }

          return nextLocation;
        });
      },
      () => {
        setDriverLocation(null);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 20000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void refreshDashboard();

    return () => {
      isMountedRef.current = false;
    };
  }, [refreshDashboard]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshDashboard({ silent: true });
      }
    }, 30000);

    return () => window.clearInterval(interval);
  }, [refreshDashboard]);

  useEffect(() => {
    const handleFocus = () => {
      void refreshDashboard({ silent: true });
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [refreshDashboard]);

  useEffect(() => {
    const { userId, userRole } = getStoredUserIdentity();
    if (userRole !== "driver") {
      return () => undefined;
    }

    return subscribeToDriverDashboard(userId, () => {
      void refreshDashboard({ silent: true });
    });
  }, [refreshDashboard]);

  const value = useMemo<JobsContextType>(
    () => ({
      jobs,
      metrics,
      isOnline,
      isLoading,
      isRefreshing,
      isMutating,
      hasLoaded,
      error,
      refreshDashboard,
      setOnlineStatus,
      acceptJob,
      updateJobStatus,
      updateParcelStatus,
    }),
    [
      jobs,
      metrics,
      isOnline,
      isLoading,
      isRefreshing,
      isMutating,
      hasLoaded,
      error,
      refreshDashboard,
      setOnlineStatus,
      acceptJob,
      updateJobStatus,
      updateParcelStatus,
    ],
  );

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export function useJobs() {
  const context = useContext(JobsContext);
  if (!context) throw new Error("useJobs must be used within a JobsProvider");
  return context;
}
