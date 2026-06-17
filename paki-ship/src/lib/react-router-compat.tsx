"use client";

import LinkComponent from "next/link";
import { useParams as useNextParams, usePathname, useRouter } from "next/navigation";
import { useRouteContext } from "@/lib/route-context";

type NavigateOptions = {
  replace?: boolean;
  state?: unknown;
};

export function Link({
  to,
  children,
  ...props
}: Omit<React.ComponentProps<typeof LinkComponent>, "href"> & {
  to: string;
}) {
  return (
    <LinkComponent href={to} {...props}>
      {children}
    </LinkComponent>
  );
}

export function useNavigate() {
  const router = useRouter();

  return (to: string | number, options?: NavigateOptions) => {
    if (typeof to === "number") {
      if (to < 0) {
        router.back();
      } else {
        router.forward();
      }
      return;
    }

    if (options?.state) {
      sessionStorage.setItem(`route-state:${to}`, JSON.stringify(options.state));
    }

    if (options?.replace) {
      router.replace(to);
      return;
    }

    router.push(to);
  };
}

export function useParams<T extends Record<string, string | undefined>>() {
  const nextParams = useNextParams<T>();
  const routeContext = useRouteContext();

  return {
    ...(nextParams || {}),
    ...(routeContext.params as T),
  };
}

export function useRouteError() {
  return null;
}

export function useLocation() {
  const pathname = usePathname();
  return { pathname };
}

export function createBrowserRouter(routes?: unknown) {
  return routes ?? null;
}

export function RouterProvider(_: { router?: unknown }) {
  return null;
}
