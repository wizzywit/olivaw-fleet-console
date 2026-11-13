'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { connectFleetLive } from '../adapter/fleetLiveAdapter';
import { fleetLiveStore } from './fleetLiveStore';
import { fleetSnapshotQuery, fleetSnapshotQueryKey } from './fleetSnapshotQuery';

// Keeps the app-wide live store in sync: seeds it from the snapshot, opens the live connection once seeded,
// refetches on resync, and applies held patches when the tab becomes visible again. Called once by the app.
export function useFleetLiveSync(): void {
  const queryClient = useQueryClient();
  const snapshot = useQuery(fleetSnapshotQuery());

  useEffect(() => {
    if (snapshot.data !== undefined) fleetLiveStore.getState().seed(snapshot.data);
  }, [snapshot.data]);

  useEffect(() => {
    const flushWhenVisible = () => {
      if (document.visibilityState === 'visible') fleetLiveStore.getState().flush();
    };
    document.addEventListener('visibilitychange', flushWhenVisible);
    return () => {
      document.removeEventListener('visibilitychange', flushWhenVisible);
    };
  }, []);

  useEffect(() => {
    let connection: ReturnType<typeof connectFleetLive> | null = null;
    const open = () => {
      connection = connectFleetLive(
        {
          onPatch: (patch) => {
            fleetLiveStore.getState().queuePatch(patch);
          },
          onResync: () => {
            void queryClient.invalidateQueries({ queryKey: fleetSnapshotQueryKey });
          },
          onStatus: (status, retryInMs) => {
            fleetLiveStore.getState().setLive(status, retryInMs);
          },
        },
        () => fleetLiveStore.getState().sequence,
      );
      fleetLiveStore.getState().setRetryLive(() => {
        connection?.retryNow();
      });
    };
    if (fleetLiveStore.getState().sequence !== null) open();
    const unsubscribe = fleetLiveStore.subscribe((state, previous) => {
      if (connection === null && previous.sequence === null && state.sequence !== null) open();
    });
    return () => {
      unsubscribe();
      connection?.close();
    };
  }, [queryClient]);
}
