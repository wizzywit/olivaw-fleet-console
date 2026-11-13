'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { fromSearchParams, replaceFilterInUrl } from '../adapter/fleetFilterUrlAdapter';
import { parseFleetQuery } from '../services/fleetQuery';
import type { FleetFilter, FleetFilterParams } from '../types/fleetFilter';

export function useFleetFilterRepository() {
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? '';

  const filter = useMemo((): FleetFilter => {
    const params = fromSearchParams(new URLSearchParams(search));
    return { ...params, query: parseFleetQuery(params.rawQuery) };
  }, [search]);

  const setFilter = useCallback((next: FleetFilterParams) => {
    replaceFilterInUrl(next);
  }, []);

  return { filter, setFilter };
}
