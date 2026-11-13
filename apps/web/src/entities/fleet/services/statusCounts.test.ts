import { totalOf } from './statusCounts';

describe('totalOf', () => {
  it('adds up every status', () => {
    expect(totalOf({ working: 3, charging: 2, idle: 1, attention: 4, offline: 0 })).toBe(10);
  });
});
