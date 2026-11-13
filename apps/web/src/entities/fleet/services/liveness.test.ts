import { isLive } from './liveness';

describe('isLive', () => {
  it('is true only while the live connection is open', () => {
    expect(isLive('live')).toBe(true);
    expect(isLive('reconnecting')).toBe(false);
    expect(isLive('connecting')).toBe(false);
    expect(isLive('offline')).toBe(false);
  });
});
