import { describe, expect, it } from 'vitest';
import { createSeenMarks } from './seenMarks';

describe('seen marks', () => {
  it('counts every member as unseen until someone marks it', () => {
    const marks = createSeenMarks();
    expect(marks.unseenIn('stuck', ['A', 'B'])).toBe(2);
    marks.mark('stuck', ['A']);
    expect(marks.unseenIn('stuck', ['A', 'B'])).toBe(1);
  });

  it('keeps a mark to its reason', () => {
    const marks = createSeenMarks();
    marks.mark('stuck', ['A']);
    expect(marks.unseenIn('battery-critical', ['A'])).toBe(1);
  });

  it('treats a member that joined after the mark as unseen', () => {
    const marks = createSeenMarks();
    marks.mark('stuck', ['A', 'B']);
    expect(marks.unseenIn('stuck', ['A', 'B', 'C'])).toBe(1);
  });

  it('forgets members that left, so a robot that comes back is unseen again', () => {
    const marks = createSeenMarks();
    marks.mark('stuck', ['A', 'B']);
    marks.keepOnly('stuck', ['A']);
    expect(marks.unseenIn('stuck', ['A', 'B'])).toBe(1);
  });

  it('says whether a mark changed anything', () => {
    const marks = createSeenMarks();
    expect(marks.mark('stuck', ['A'])).toBe(true);
    expect(marks.mark('stuck', ['A'])).toBe(false);
    expect(marks.mark('stuck', [])).toBe(false);
  });
});
