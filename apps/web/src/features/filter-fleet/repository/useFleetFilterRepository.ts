'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { fromSearchParams, replaceFilterInUrl } from '../adapter/fleetFilterUrlAdapter';
import { parseFleetQuery } from '../services/fleetQuery';
import type { FleetFilter, FleetFilterParams } from '../types/fleetFilter';

export function useFleetFilterRepository() {
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? '/';
  const search = searchParams?.toString() ?? '';

  const filter = useMemo((): FleetFilter => {
    const params = fromSearchParams(new URLSearchParams(search));
    return { ...params, query: parseFleetQuery(params.rawQuery) };
  }, [search]);

  const setFilter = useCallback(
    (next: FleetFilterParams) => {
      replaceFilterInUrl(pathname, next);
    },
    [pathname],
  );

  return { filter, setFilter };
}
