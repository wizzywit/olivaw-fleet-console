'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { fromSearchParams, toSearchParams } from '../adapter/fleetFilterUrlAdapter';
import { parseFleetQuery } from '../services/fleetQuery';
import type { FleetFilter, FleetFilterParams } from '../types/fleetFilter';

export function useFleetFilterRepository() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const search = searchParams?.toString() ?? '';

  const filter = useMemo((): FleetFilter => {
    const params = fromSearchParams(new URLSearchParams(search));
    return { ...params, query: parseFleetQuery(params.rawQuery) };
  }, [search]);

  const setFilter = useCallback(
    (next: FleetFilterParams) => {
      const query = toSearchParams(next).toString();
      router.replace(query === '' ? pathname : `${pathname}?${query}`, { scroll: false });
    },
    [router, pathname],
  );

  return { filter, setFilter };
}
