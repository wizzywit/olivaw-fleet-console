import { dehydrate, QueryClient, type DehydratedState } from '@tanstack/react-query';
import { fleetSnapshotQuery } from './fleetSnapshotQuery';

// Runs on the server so the first paint already has the fleet. If ingest is down, the client fetches and shows the error.
export async function prefetchFleetSnapshot(): Promise<DehydratedState> {
  const queryClient = new QueryClient();
  await queryClient.query(fleetSnapshotQuery()).catch(() => undefined);
  return dehydrate(queryClient);
}
