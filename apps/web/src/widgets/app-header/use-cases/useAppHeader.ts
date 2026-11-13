'use client';

import { usePathname } from 'next/navigation';
import { useFleetAggregates, useLivePause, useLiveStatus, type LiveStatus } from '@/entities/fleet';
import { useFleetFilter } from '@/features/filter-fleet';
import { formatCount } from '@/shared/lib';

export type LiveTone = 'live' | 'paused' | 'down';

const liveText: Record<LiveStatus, string> = {
  live: 'Live',
  connecting: 'Connecting',
  reconnecting: 'Reconnecting',
  offline: 'Offline',
};

export function useAppHeader() {
  const aggregates = useFleetAggregates();
  const live = useLiveStatus();
  const { isPaused, pendingCount, pause, resume } = useLivePause();
  const { filter } = useFleetFilter();
  const onOverview = (usePathname() ?? '/') === '/';
  const attentionCount = aggregates?.byStatus.attention;

  let statusText = liveText[live.status];
  if (isPaused) statusText = `Paused · ${formatCount(pendingCount)} updates waiting`;
  else if (live.status === 'reconnecting' && live.retryInMs !== null) {
    statusText = `Reconnecting · next try in ${Math.ceil(live.retryInMs / 1000)} s`;
  }

  let tone: LiveTone = 'down';
  if (isPaused) tone = 'paused';
  else if (live.status === 'live') tone = 'live';

  return {
    isFleetCurrent: onOverview && filter.status !== 'attention',
    isAttentionCurrent: onOverview && filter.status === 'attention',
    attentionCountLabel: attentionCount === undefined ? null : formatCount(attentionCount),
    statusText,
    tone,
    pauseLabel: isPaused ? 'Resume live updates' : 'Pause live updates',
    togglePause: isPaused ? resume : pause,
  };
}
