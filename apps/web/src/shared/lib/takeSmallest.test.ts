import { takeSmallest } from './takeSmallest';

const byValue = (a: number, b: number) => a - b;

describe('takeSmallest', () => {
  it('returns the n smallest items in order, like sorting and slicing', () => {
    const items = Array.from({ length: 500 }, (_, index) => (index * 7919) % 1000);
    expect(takeSmallest(items, 8, byValue)).toEqual([...items].sort(byValue).slice(0, 8));
  });

  it('returns everything in order when there are fewer items than asked for, and leaves the input alone', () => {
    const items = [3, 1, 2];
    expect(takeSmallest(items, 8, byValue)).toEqual([1, 2, 3]);
    expect(items).toEqual([3, 1, 2]);
  });
});
