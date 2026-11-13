'use client';

import { isLive, useLiveStatus } from '@/entities/fleet';
import type { AttentionReason } from '@/entities/robot';
import { useAcknowledgementRepository } from '../repository/useAcknowledgementRepository';

export function useAcknowledgeAttention(reason: AttentionReason, robotIds: readonly string[]) {
  const live = useLiveStatus();
  const { acknowledge, isPending, failed } = useAcknowledgementRepository();
  return {
    canAcknowledge: isLive(live.status) && !isPending,
    failed,
    acknowledge: () => {
      acknowledge({ reason, robotIds });
    },
  };
}
