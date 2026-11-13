import { aRobot } from '@/test/robotFixtures';
import { isBatteryCritical } from './batteryState';

describe('isBatteryCritical', () => {
  it('follows the server decision instead of re-applying the threshold', () => {
    expect(isBatteryCritical(aRobot({ attentionReasons: ['battery-critical'] }))).toBe(true);
    expect(
      isBatteryCritical(aRobot({ battery: { percent: 3, charging: false }, attentionReasons: [] })),
    ).toBe(false);
  });
});
