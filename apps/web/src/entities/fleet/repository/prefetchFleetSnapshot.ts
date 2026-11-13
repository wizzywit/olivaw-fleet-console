import { dehydrate, QueryClient, type DehydratedState } from '@tanstack/react-query';
import { fleetSnapshotQuery } from './fleetSnapshotQuery';

// Runs on the server so the snapshot arrives with the page and hydration needs no extra request. The live store is
// seeded on the client only (it is shared module state), so the first paint shows the loading state, never an empty fleet.
// A hung ingest server must not hold the page; after the timeout the client loads the snapshot itself.
export async function prefetchFleetSnapshot(timeoutMs = 3000): Promise<DehydratedState> {
  const queryClient = new QueryClient();
  await queryClient.query(fleetSnapshotQuery({ timeoutMs })).catch(() => undefined);
  return dehydrate(queryClient);
}
