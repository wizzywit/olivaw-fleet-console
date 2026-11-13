import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { connection } from 'next/server';
import type { ReactNode } from 'react';
import { fleetSnapshotQuery } from './fleetSnapshotQuery';

// Server component: the first paint already has the fleet. If ingest is down, the client fetches and shows the error state.
export async function FleetSnapshotHydration({ children }: { children: ReactNode }) {
  await connection();
  const queryClient = new QueryClient();
  await queryClient.query(fleetSnapshotQuery()).catch(() => undefined);
  return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>;
}
