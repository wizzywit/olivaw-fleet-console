import { aRobot } from '@/test/robotFixtures';
import type { Robot } from '@/entities/robot';
import { applyFleetPatches } from './fleetPatches';

const merge = (robot: Robot | undefined, patch: { id: string; percent?: number }): Robot | null =>
  robot === undefined
    ? null
    : { ...robot, battery: { ...robot.battery, percent: patch.percent ?? robot.battery.percent } };

describe('applyFleetPatches', () => {
  const start = new Map([
    ['A', aRobot({ id: 'A' })],
    ['B', aRobot({ id: 'B' })],
  ]);

  it('applies patches in order, so the last value wins', () => {
    const next = applyFleetPatches(
      start,
      [
        { robots: [{ id: 'A', percent: 50 }], removed: [] },
        { robots: [{ id: 'A', percent: 40 }], removed: [] },
      ],
      merge,
    );
    expect(next.get('A')?.battery.percent).toBe(40);
  });

  it('removes robots and ignores merges that are rejected', () => {
    const next = applyFleetPatches(start, [{ robots: [{ id: 'NEW', percent: 5 }], removed: ['B'] }], merge);
    expect([...next.keys()]).toEqual(['A']);
  });

  it('never changes the map it was given', () => {
    applyFleetPatches(start, [{ robots: [{ id: 'A', percent: 1 }], removed: ['B'] }], merge);
    expect(start.get('A')?.battery.percent).toBe(78);
    expect(start.has('B')).toBe(true);
  });
});
