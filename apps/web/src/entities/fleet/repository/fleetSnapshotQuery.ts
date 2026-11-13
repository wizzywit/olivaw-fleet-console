import { queryOptions } from '@tanstack/react-query';
import { fetchFleetSnapshotDto, toFleetSnapshot } from '../adapter/fleetApiAdapter';

export const fleetSnapshotQueryKey = ['fleet', 'snapshot'] as const;

// The cache holds the wire DTO so it can be dehydrated from the server as plain JSON; select maps it to the domain.
export const fleetSnapshotQuery = () =>
  queryOptions({
    queryKey: fleetSnapshotQueryKey,
    queryFn: ({ signal }) => fetchFleetSnapshotDto(signal),
    select: toFleetSnapshot,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
  });
