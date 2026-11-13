import type { RobotStatus } from '../types/robot';

const statusLabels: Record<RobotStatus, string> = {
  working: 'Working',
  charging: 'Charging',
  idle: 'Idle',
  attention: 'Needs attention',
  offline: 'Offline',
};

export const robotStatusLabel = (status: RobotStatus): string => statusLabels[status];
