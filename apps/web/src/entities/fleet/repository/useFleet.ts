'use client';

import { useQuery } from '@tanstack/react-query';
import { useStore } from 'zustand';
import type { Robot } from '@/entities/robot/@x/fleet';
import { fleetLiveStore, type FleetLiveState } from './fleetLiveStore';
import { fleetSnapshotQuery } from './fleetSnapshotQuery';

const useFleetState = <T>(selector: (state: FleetLiveState) => T): T => useStore(fleetLiveStore, selector);

// Loading lasts until the live store is seeded, so no screen ever shows an empty fleet that is really just unseeded.
export function useFleetRepository() {
  const query = useQuery(fleetSnapshotQuery());
  const isSeeded = useFleetState((state) => state.sequence !== null);
  return {
    isLoading: query.isPending || (!isSeeded && query.error === null),
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}

export const useFleetRobots = (): Map<string, Robot> => useFleetState((state) => state.robots);
export const useFleetRobot = (id: string): Robot | undefined =>
  useFleetState((state) => state.robots.get(id));
export const useFleetAggregates = () => useFleetState((state) => state.aggregates);
export const useFleetSites = () => useFleetState((state) => state.sites);
export const useFleetConfig = () => useFleetState((state) => state.config);
export const useLiveStatus = () => useFleetState((state) => state.live);
export const useRetryLive = (): (() => void) => useFleetState((state) => state.retryLive);

export function useLivePause() {
  const isPaused = useFleetState((state) => state.isPaused);
  const pendingCount = useFleetState((state) => state.pendingCount);
  const pause = useFleetState((state) => state.pause);
  const resume = useFleetState((state) => state.resume);
  return { isPaused, pendingCount, pause, resume };
}
