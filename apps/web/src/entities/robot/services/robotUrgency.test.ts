import { aRobot } from '@/test/robotFixtures';
import { compareByUrgency } from './robotUrgency';

describe('compareByUrgency', () => {
  it('orders attention, offline, charging, working, idle', () => {
    const robots = (['idle', 'working', 'charging', 'offline', 'attention'] as const).map((status, index) =>
      aRobot({ id: `R-${index}`, status }),
    );
    expect([...robots].sort(compareByUrgency).map((robot) => robot.status)).toEqual([
      'attention',
      'offline',
      'charging',
      'working',
      'idle',
    ]);
  });

  it('breaks ties by lower battery, then by id', () => {
    const attention = { status: 'attention' as const };
    const low = aRobot({ ...attention, id: 'B', battery: { percent: 4, charging: false } });
    const high = aRobot({ ...attention, id: 'A', battery: { percent: 9, charging: false } });
    const sameAsHigh = aRobot({ ...attention, id: 'C', battery: { percent: 9, charging: false } });
    expect([sameAsHigh, high, low].sort(compareByUrgency).map((robot) => robot.id)).toEqual(['B', 'A', 'C']);
  });
});
