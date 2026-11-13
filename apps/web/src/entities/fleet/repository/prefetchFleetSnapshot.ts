import { dehydrate, QueryClient, type DehydratedState } from '@tanstack/react-query';
import { fleetSnapshotQuery } from './fleetSnapshotQuery';

// Runs on the server so the snapshot arrives with the page and hydration needs no extra request. The live store is
// seeded on the client only (it is shared module state), so the first paint shows the loading state, never an empty fleet.
export async function prefetchFleetSnapshot(): Promise<DehydratedState> {
  const queryClient = new QueryClient();
  await queryClient.query(fleetSnapshotQuery()).catch(() => undefined);
  return dehydrate(queryClient);
}
