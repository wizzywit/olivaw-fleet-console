'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { connectFleetLive } from '../adapter/fleetLiveAdapter';
import { createFleetLiveStore, type FleetLiveStore } from './fleetLiveStore';
import { fleetSnapshotQuery, fleetSnapshotQueryKey } from './fleetSnapshotQuery';

export interface FleetStoreContextValue {
  store: FleetLiveStore;
  retryLive: () => void;
}

export const FleetStoreContext = createContext<FleetStoreContextValue | null>(null);

export function FleetStoreProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [store] = useState(() =>
    createFleetLiveStore({
      schedule: (run) => requestAnimationFrame(run),
      isHidden: () => document.visibilityState === 'hidden',
      now: () => new Date(),
    }),
  );
  const retryRef = useRef<() => void>(() => undefined);
  const [value] = useState<FleetStoreContextValue>(() => ({
    store,
    retryLive: () => {
      retryRef.current();
    },
  }));

  // Fleet data is app-wide (the header shows counts on every page), so the provider fetches and seeds it.
  const snapshot = useQuery(fleetSnapshotQuery());
  useEffect(() => {
    if (snapshot.data !== undefined) store.getState().seed(snapshot.data);
  }, [snapshot.data, store]);

  useEffect(() => {
    const flushWhenVisible = () => {
      if (document.visibilityState === 'visible') store.getState().flush();
    };
    document.addEventListener('visibilitychange', flushWhenVisible);
    return () => {
      document.removeEventListener('visibilitychange', flushWhenVisible);
    };
  }, [store]);

  // The live connection starts after the first snapshot, so the server knows which patches this console still needs.
  useEffect(() => {
    let connection: ReturnType<typeof connectFleetLive> | null = null;
    const open = () => {
      connection = connectFleetLive(
        {
          onPatch: (patch) => {
            store.getState().queuePatch(patch);
          },
          onResync: () => {
            void queryClient.invalidateQueries({ queryKey: fleetSnapshotQueryKey });
          },
          onStatus: (status, retryInMs) => {
            store.getState().setLive(status, retryInMs);
          },
        },
        () => store.getState().sequence,
      );
      retryRef.current = () => {
        connection?.retryNow();
      };
    };
    if (store.getState().sequence !== null) open();
    const unsubscribe = store.subscribe((state, previous) => {
      if (connection === null && previous.sequence === null && state.sequence !== null) open();
    });
    return () => {
      unsubscribe();
      connection?.close();
    };
  }, [store, queryClient]);

  return <FleetStoreContext.Provider value={value}>{children}</FleetStoreContext.Provider>;
}
