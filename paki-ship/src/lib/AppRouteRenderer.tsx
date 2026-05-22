"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { JobsProvider } from "@/features/pages/JobsContext";
import { resolveRoute } from "@/lib/app-routes";
import { RouteContextProvider } from "@/lib/route-context";
import { apiFetch } from "@/lib/api-client";

export function AppRouteRenderer() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const isApplicationGatedRoute =
    pathname.startsWith("/driver") || pathname.startsWith("/operator");
  const [isCheckingApplication, setIsCheckingApplication] = useState(
    isApplicationGatedRoute,
  );
  const { component: Component, params } = useMemo(
    () => resolveRoute(pathname),
    [pathname],
  );

  useEffect(() => {
    if (!isApplicationGatedRoute) {
      setIsCheckingApplication(false);
      return;
    }

    let cancelled = false;
    const checkApplication = async () => {
      setIsCheckingApplication(true);

      try {
        const response = await apiFetch("/api/auth/application-status");
        const result = await response.json();
        if (!cancelled && response.ok && !result.approved) {
          router.replace("/application/waiting");
          return;
        }
      } catch {
        // Dashboard requests still enforce authentication and can surface their own errors.
      }

      if (!cancelled) {
        setIsCheckingApplication(false);
      }
    };

    void checkApplication();

    return () => {
      cancelled = true;
    };
  }, [isApplicationGatedRoute, router]);

  if (isCheckingApplication) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0F9F8] text-sm font-bold text-[#1A5D56]">
        Checking application status...
      </div>
    );
  }

  return (
    <RouteContextProvider value={{ pathname, params }}>
      <JobsProvider>
        <Component />
      </JobsProvider>
    </RouteContextProvider>
  );
}
