import type { Robot, RobotStatus } from '../types/robot';

const statusRank: Record<RobotStatus, number> = {
  attention: 0,
  offline: 1,
  charging: 2,
  working: 3,
  idle: 4,
};

export function compareByUrgency(a: Robot, b: Robot): number {
  return (
    statusRank[a.status] - statusRank[b.status] ||
    a.battery.percent - b.battery.percent ||
    a.id.localeCompare(b.id)
  );
}
