'use client';

import { isLinkDown, useLiveStatus, useRetryLive } from '@/entities/fleet';
import { formatClockTime, formatRelativeTime, useNow } from '@/shared/lib';

export function useLiveConnectionBanner() {
  const live = useLiveStatus();
  const retry = useRetryLive();
  const now = useNow(1000);
  const isVisible = isLinkDown(live.status);
  const asOf =
    live.lastPatchAt === null
      ? 'No live updates have arrived yet.'
      : `You are seeing the fleet as of ${formatClockTime(live.lastPatchAt)}, ${formatRelativeTime(live.lastPatchAt, now)}.`;
  return {
    isVisible,
    message: `${asOf} Commands are disabled until the connection is back.`,
    retry,
  };
}
