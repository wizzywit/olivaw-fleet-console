import type { RobotStatus } from '@/entities/robot/@x/fleet';
import type { LiveStatus } from '../types/fleet';

export const isLive = (status: LiveStatus): boolean => status === 'live';

// "Connecting" is the first load, shown as loading; only a lost connection counts as down.
export const isLinkDown = (status: LiveStatus): boolean => status === 'reconnecting' || status === 'offline';

// The client's one freshness rule (ADR 0008): values are last known when the console is not live,
// and an offline robot's values are always last known.
export const isLastKnownValue = (robotStatus: RobotStatus, liveStatus: LiveStatus): boolean =>
  !isLive(liveStatus) || robotStatus === 'offline';
