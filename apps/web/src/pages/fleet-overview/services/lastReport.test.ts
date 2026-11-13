import { lastReportLabel } from './lastReport';

const now = new Date('2026-11-13T10:05:00.000Z');

describe('lastReportLabel', () => {
  it('says live for a robot that is still reporting', () => {
    expect(
      lastReportLabel({ status: 'working', lastReportAt: new Date('2026-11-13T10:01:00.000Z') }, now),
    ).toBe('Live');
    expect(lastReportLabel({ status: 'attention', lastReportAt: now }, now)).toBe('Live');
  });

  it('says how long ago an offline robot last reported', () => {
    expect(
      lastReportLabel({ status: 'offline', lastReportAt: new Date('2026-11-13T10:03:00.000Z') }, now),
    ).toBe('2 min ago');
  });
});
