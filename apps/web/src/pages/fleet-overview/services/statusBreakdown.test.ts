import { statusBreakdown } from './statusBreakdown';

describe('statusBreakdown', () => {
  it('lists every status in bar order with its count and share of the site', () => {
    expect(statusBreakdown({ working: 6, charging: 2, idle: 0, attention: 1, offline: 1 })).toEqual([
      { status: 'working', count: 6, percent: 60 },
      { status: 'charging', count: 2, percent: 20 },
      { status: 'idle', count: 0, percent: 0 },
      { status: 'attention', count: 1, percent: 10 },
      { status: 'offline', count: 1, percent: 10 },
    ]);
  });

  it('reports zero shares for a site without robots', () => {
    expect(
      statusBreakdown({ working: 0, charging: 0, idle: 0, attention: 0, offline: 0 }).map(
        (entry) => entry.percent,
      ),
    ).toEqual([0, 0, 0, 0, 0]);
  });
});
