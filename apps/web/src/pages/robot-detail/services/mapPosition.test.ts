import { toMapPercent } from './mapPosition';

describe('toMapPercent', () => {
  it('converts metres on a map to percentages of its size', () => {
    expect(toMapPercent({ x: 15, y: 5 }, { width: 60, height: 20 })).toEqual({ left: 25, top: 25 });
  });

  it('keeps positions just outside the map on its edge', () => {
    expect(toMapPercent({ x: -2, y: 25 }, { width: 60, height: 20 })).toEqual({ left: 0, top: 100 });
  });
});
