"use client";

import { createContext, useContext } from "react";

type RouteContextValue = {
  pathname: string;
  params: Record<string, string>;
};

const RouteContext = createContext<RouteContextValue>({
  pathname: "/",
  params: {},
});

export function RouteContextProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: RouteContextValue;
}) {
  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
}

export function useRouteContext() {
  return useContext(RouteContext);
}
