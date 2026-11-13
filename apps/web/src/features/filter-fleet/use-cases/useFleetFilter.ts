'use client';

import type { RobotStatus } from '@/entities/robot';
import { useFleetFilterRepository } from '../repository/useFleetFilterRepository';

export function useFleetFilter() {
  const { filter, setFilter } = useFleetFilterRepository();
  return {
    filter,
    isActive: filter.status !== 'all' || filter.siteId !== null || filter.rawQuery.trim() !== '',
    setStatus: (status: RobotStatus | 'all') => {
      setFilter({ ...filter, status });
    },
    toggleSite: (siteId: string) => {
      setFilter({ ...filter, siteId: filter.siteId === siteId ? null : siteId });
    },
    setQuery: (rawQuery: string) => {
      setFilter({ ...filter, rawQuery });
    },
    clear: () => {
      setFilter({ status: 'all', siteId: null, rawQuery: '' });
    },
  };
}
