"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { JobsProvider } from "@/features/pages/JobsContext";
import { resolveRoute } from "@/lib/app-routes";
import { RouteContextProvider } from "@/lib/route-context";

export function AppRouteRenderer() {
  const pathname = usePathname() || "/";
  const { component: Component, params } = useMemo(
    () => resolveRoute(pathname),
    [pathname],
  );

  return (
    <RouteContextProvider value={{ pathname, params }}>
      <JobsProvider>
        <Component />
      </JobsProvider>
    </RouteContextProvider>
  );
}
