import { isLastKnownValue, isLinkDown, isLive } from './liveness';

describe('liveness rules', () => {
  it('is live only while the socket is open', () => {
    expect(isLive('live')).toBe(true);
    expect(isLive('reconnecting')).toBe(false);
    expect(isLive('connecting')).toBe(false);
    expect(isLive('offline')).toBe(false);
  });

  it('treats the link as down while reconnecting or offline, not while first connecting', () => {
    expect(isLinkDown('reconnecting')).toBe(true);
    expect(isLinkDown('offline')).toBe(true);
    expect(isLinkDown('connecting')).toBe(false);
    expect(isLinkDown('live')).toBe(false);
  });

  it('shows a value as last known when the console is not live or the robot is offline', () => {
    expect(isLastKnownValue('working', 'live')).toBe(false);
    expect(isLastKnownValue('offline', 'live')).toBe(true);
    expect(isLastKnownValue('working', 'reconnecting')).toBe(true);
  });
});
