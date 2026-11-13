'use client';

import { isLive, useLivePause, useLiveStatus } from '@/entities/fleet';
import type { AttentionReason } from '@/entities/robot';
import { useAcknowledgementRepository } from '../repository/useAcknowledgementRepository';

export function useAcknowledgeAttention(reason: AttentionReason, robotIds: readonly string[]) {
  const live = useLiveStatus();
  const { isPaused } = useLivePause();
  const { acknowledge, isPending, failed } = useAcknowledgementRepository();
  return {
    // While paused, the confirming patch would be held back, so pressing would look like it did nothing.
    canAcknowledge: isLive(live.status) && !isPaused && !isPending,
    failed,
    acknowledge: () => {
      acknowledge({ reason, robotIds });
    },
  };
}
