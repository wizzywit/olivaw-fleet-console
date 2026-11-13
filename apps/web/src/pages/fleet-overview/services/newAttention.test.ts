import { aRobot } from '@/test/robotFixtures';
import { countNewInAttention } from './newAttention';

const now = new Date('2026-11-13T10:00:00.000Z');
const since = (msAgo: number) => new Date(now.getTime() - msAgo);

describe('countNewInAttention', () => {
  it('counts members that entered attention within the window, inclusive', () => {
    const robots = new Map([
      ['A', aRobot({ id: 'A', attentionSince: since(120_000) })],
      ['B', aRobot({ id: 'B', attentionSince: since(120_001) })],
      ['C', aRobot({ id: 'C', attentionSince: since(5_000) })],
      ['D', aRobot({ id: 'D', attentionSince: null })],
    ]);
    expect(countNewInAttention(['A', 'B', 'C', 'D', 'missing'], robots, now, 120_000)).toBe(2);
  });
});
