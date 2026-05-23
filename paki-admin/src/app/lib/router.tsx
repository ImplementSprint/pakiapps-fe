'use client';

import { useRouter, useSearchParams as useNextSearchParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';

export function useNavigate() {
  const router = useRouter();

  return (to: string) => {
    void router.push(to);
  };
}

export function useSearchParams(): [URLSearchParams] {
  const searchParams = useNextSearchParams();

  return useMemo(() => {
    return [new URLSearchParams(searchParams?.toString() ?? '')];
  }, [searchParams]);
}

interface NavigateProps {
  replace?: boolean;
  to: string;
}

export function Navigate({ replace = false, to }: NavigateProps) {
  const router = useRouter();

  useEffect(() => {
    if (replace) {
      void router.replace(to);
      return;
    }

    void router.push(to);
  }, [replace, router, to]);

  return null;
}
