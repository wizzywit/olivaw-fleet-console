'use client';

import { isLive, useLiveStatus } from '@/entities/fleet';
import type { AttentionReason } from '@/entities/robot';
import { useSeenMarkRepository } from '../repository/useSeenMarkRepository';

export function useMarkAttentionSeen(reason: AttentionReason, robotIds: readonly string[]) {
  const live = useLiveStatus();
  const { markSeen, isPending, failed } = useSeenMarkRepository();
  return {
    canMark: isLive(live.status) && !isPending,
    failed,
    markSeen: () => {
      markSeen({ reason, robotIds });
    },
  };
}
