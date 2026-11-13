import type { RobotStatus } from '@/entities/robot';
import { formatRelativeTime } from '@/shared/lib';

// A robot that is not offline reported within the stale threshold; the stream sends its report time only with other
// changes (ADR 0018), so the time is shown where it matters: for robots that went silent. While the console itself is
// disconnected, it cannot vouch for anyone being live.
export function lastReportLabel(
  robot: { status: RobotStatus; lastReportAt: Date; isStale: boolean },
  now: Date,
): string {
  if (robot.status === 'offline') return formatRelativeTime(robot.lastReportAt, now);
  return robot.isStale ? 'Last known' : 'Live';
}
