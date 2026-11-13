import { formatClockTime, formatCount, formatPercent, formatRelativeTime } from './format';

const at = (ms: number) => new Date(Date.UTC(2026, 10, 13, 10, 0, 0) + ms);

describe('formatRelativeTime', () => {
  it('says just now below two seconds', () => {
    expect(formatRelativeTime(at(0), at(1999))).toBe('just now');
  });

  it('uses seconds, then minutes, then hours', () => {
    expect(formatRelativeTime(at(0), at(2000))).toBe('2 s ago');
    expect(formatRelativeTime(at(0), at(59_999))).toBe('59 s ago');
    expect(formatRelativeTime(at(0), at(60_000))).toBe('1 min ago');
    expect(formatRelativeTime(at(0), at(2 * 60 * 60_000))).toBe('2 h ago');
  });
});

describe('number formats', () => {
  it('formats counts with thousands separators', () => {
    expect(formatCount(1248)).toBe('1,248');
  });

  it('formats whole percentages', () => {
    expect(formatPercent(12)).toBe('12%');
  });

  it('formats a clock time with seconds', () => {
    expect(formatClockTime(new Date(2026, 10, 13, 10, 40, 25))).toBe('10:40:25');
  });
});
