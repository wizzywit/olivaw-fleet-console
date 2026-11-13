import { StatusBadge } from '@/shared/ui';
import { robotStatusLabel } from '../robotStatusLabel';
import type { RobotStatus } from '../../types/robot';

export function RobotStatusBadge({ status, isStale = false }: { status: RobotStatus; isStale?: boolean }) {
  return <StatusBadge tone={status} label={robotStatusLabel(status)} isStale={isStale} />;
}
