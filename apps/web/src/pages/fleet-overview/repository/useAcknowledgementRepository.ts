'use client';

import { useMutation } from '@tanstack/react-query';
import type { AttentionReason } from '@/entities/robot';
import { acknowledgeGroup } from '../adapter/acknowledgementAdapter';

// No cache update: the server answers every console with a live patch carrying the new unacknowledged count.
export function useAcknowledgementRepository() {
  const mutation = useMutation({
    mutationFn: ({ reason, robotIds }: { reason: AttentionReason; robotIds: readonly string[] }) =>
      acknowledgeGroup(reason, robotIds),
  });
  return { acknowledge: mutation.mutate, isPending: mutation.isPending, failed: mutation.isError };
}
