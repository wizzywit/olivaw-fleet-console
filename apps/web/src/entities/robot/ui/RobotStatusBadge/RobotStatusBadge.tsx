import { StatusBadge } from '@/shared/ui';
import type { RobotStatus } from '../../types/robot';

const labels: Record<RobotStatus, string> = {
  working: 'Working',
  charging: 'Charging',
  idle: 'Idle',
  attention: 'Needs attention',
  offline: 'Offline',
};

export function RobotStatusBadge({ status, isStale = false }: { status: RobotStatus; isStale?: boolean }) {
  return <StatusBadge tone={status} label={labels[status]} isStale={isStale} />;
}
