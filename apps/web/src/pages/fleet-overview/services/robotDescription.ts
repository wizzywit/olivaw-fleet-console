import { robotStatusLabel, type RobotStatus } from '@/entities/robot';
import { formatPercent } from '@/shared/lib';

export interface DescribedRobot {
  id: string;
  status: RobotStatus;
  batteryPercent: number;
  isStale: boolean;
}

// The sentence screen readers hear for the focused robot, in the table and in the grid.
export const describeRobot = (robot: DescribedRobot, position: string): string =>
  `${position}: ${robot.id}, ${robotStatusLabel(robot.status)}${robot.isStale ? ' (last known)' : ''}, battery ${formatPercent(robot.batteryPercent)}`;
