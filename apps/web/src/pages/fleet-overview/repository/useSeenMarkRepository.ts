'use client';

import { useMutation } from '@tanstack/react-query';
import type { AttentionReason } from '@/entities/robot';
import { markGroupSeen } from '../adapter/seenMarkAdapter';

// No cache update: the server answers every console with a live patch carrying the new unseen count.
export function useSeenMarkRepository() {
  const mutation = useMutation({
    mutationFn: ({ reason, robotIds }: { reason: AttentionReason; robotIds: readonly string[] }) =>
      markGroupSeen(reason, robotIds),
  });
  return { markSeen: mutation.mutate, isPending: mutation.isPending, failed: mutation.isError };
}
