import { isNewerPatch, patchesAfter } from './patchSequence';

describe('patch sequence rules', () => {
  it('accepts only patches newer than everything already known', () => {
    expect(isNewerPatch(11, 10)).toBe(true);
    expect(isNewerPatch(10, 10)).toBe(false);
    expect(isNewerPatch(9, 10)).toBe(false);
  });

  it('keeps only queued patches newer than a snapshot', () => {
    const queued = [{ sequence: 9 }, { sequence: 10 }, { sequence: 12 }];
    expect(patchesAfter(queued, 10)).toEqual([{ sequence: 12 }]);
  });
});
