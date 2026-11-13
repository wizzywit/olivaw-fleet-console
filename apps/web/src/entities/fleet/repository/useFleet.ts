'use client';

import { useQuery } from '@tanstack/react-query';
import { useContext, useEffect } from 'react';
import { useStore } from 'zustand';
import type { Robot } from '@/entities/robot/@x/fleet';
import { FleetStoreContext, type FleetStoreContextValue } from './FleetStoreProvider';
import type { FleetLiveState } from './fleetLiveStore';
import { fleetSnapshotQuery } from './fleetSnapshotQuery';

function useFleetContext(): FleetStoreContextValue {
  const context = useContext(FleetStoreContext);
  if (context === null) throw new Error('Fleet hooks must be used inside FleetStoreProvider');
  return context;
}

const useFleetState = <T>(selector: (state: FleetLiveState) => T): T =>
  useStore(useFleetContext().store, selector);

export function useFleetRepository() {
  const { store } = useFleetContext();
  const query = useQuery(fleetSnapshotQuery());
  useEffect(() => {
    if (query.data !== undefined) store.getState().seed(query.data);
  }, [query.data, store]);
  return {
    isLoading: query.isPending,
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
export const useRetryLive = (): (() => void) => useFleetContext().retryLive;

export function useLivePause() {
  const isPaused = useFleetState((state) => state.isPaused);
  const pendingCount = useFleetState((state) => state.pendingCount);
  const { store } = useFleetContext();
  return {
    isPaused,
    pendingCount,
    pause: () => {
      store.getState().pause();
    },
    resume: () => {
      store.getState().resume();
    },
  };
}
