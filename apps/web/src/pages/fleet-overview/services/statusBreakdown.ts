import { totalOf, type StatusCounts } from '@/entities/fleet';
import type { RobotStatus } from '@/entities/robot';

export interface StatusShare {
  status: RobotStatus;
  count: number;
  percent: number;
}

const barOrder: readonly RobotStatus[] = ['working', 'charging', 'idle', 'attention', 'offline'];

// One order for the site bar and its breakdown, so the colours and the list always line up.
export function statusBreakdown(counts: StatusCounts): StatusShare[] {
  const total = totalOf(counts);
  return barOrder.map((status) => ({
    status,
    count: counts[status],
    percent: total === 0 ? 0 : Math.round((counts[status] / total) * 100),
  }));
}
