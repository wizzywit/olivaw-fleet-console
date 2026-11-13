import { backoffDelay } from './backoff';

const middle = () => 0.5;

describe('backoffDelay', () => {
  it('doubles from 500 ms and caps at 15 s', () => {
    expect(backoffDelay(0, middle)).toBe(500);
    expect(backoffDelay(3, middle)).toBe(4000);
    expect(backoffDelay(10, middle)).toBe(15_000);
  });

  it('adds up to 20% jitter either way', () => {
    expect(backoffDelay(3, () => 0)).toBe(3200);
    expect(backoffDelay(3, () => 0.999_999)).toBeCloseTo(4800, 0);
  });
});
