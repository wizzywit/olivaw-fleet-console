import { reconcileOrder } from './stableOrder';

describe('reconcileOrder', () => {
  it('returns the new order when the list is not held', () => {
    expect(reconcileOrder(['a', 'b', 'c'], ['c', 'a', 'b'], false)).toEqual({
      order: ['c', 'a', 'b'],
      pendingChanges: 0,
    });
  });

  it('keeps the current order while held and counts rows that would move', () => {
    expect(reconcileOrder(['a', 'b', 'c'], ['c', 'a', 'b'], true)).toEqual({
      order: ['a', 'b', 'c'],
      pendingChanges: 3,
    });
  });

  it('appends new rows and drops removed rows while held', () => {
    expect(reconcileOrder(['a', 'b', 'c'], ['b', 'd', 'a'], true)).toEqual({
      order: ['a', 'b', 'd'],
      pendingChanges: 3,
    });
  });

  it('reports nothing pending when the order did not change', () => {
    expect(reconcileOrder(['a', 'b'], ['a', 'b'], true)).toEqual({ order: ['a', 'b'], pendingChanges: 0 });
  });
});
