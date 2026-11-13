import type { RobotStatus } from '@/entities/robot';
import { formatRelativeTime } from '@/shared/lib';

// A robot that is not offline reported within the stale threshold; the stream sends its report time only with other
// changes (ADR 0018), so the time is shown where it matters: for robots that went silent.
export const lastReportLabel = (robot: { status: RobotStatus; lastReportAt: Date }, now: Date): string =>
  robot.status === 'offline' ? formatRelativeTime(robot.lastReportAt, now) : 'Live';
