import { aRobot } from '@/test/robotFixtures';
import { defaultFleetFilter } from '../types/fleetFilter';
import { parseFleetQuery } from './fleetQuery';
import { matchesFleetFilter, fleetSearchMatcher } from './fleetFilterMatch';

const siteName = (id: string) => ({ 'airport-t2': 'Airport T2', 'hotel-isar': 'Hotel Isar' })[id];
const robot = aRobot({
  id: 'DLV-0087',
  vendor: 'Kairo',
  model: 'Courier K1',
  siteId: 'hotel-isar',
  zone: 'Corridor',
  status: 'attention',
  battery: { percent: 12, charging: false },
});
const withQuery = (query: string) => ({ ...defaultFleetFilter, query: parseFleetQuery(query) });

describe('matchesFleetFilter', () => {
  it('matches everything with the default filter', () => {
    expect(matchesFleetFilter(robot, defaultFleetFilter, siteName)).toBe(true);
  });

  it('filters by status and site from chips and tiles', () => {
    expect(matchesFleetFilter(robot, { ...defaultFleetFilter, status: 'attention' }, siteName)).toBe(true);
    expect(matchesFleetFilter(robot, { ...defaultFleetFilter, status: 'working' }, siteName)).toBe(false);
    expect(matchesFleetFilter(robot, { ...defaultFleetFilter, siteId: 'airport-t2' }, siteName)).toBe(false);
  });

  it('matches free text against id, vendor, model, zone and site name, ignoring case', () => {
    expect(matchesFleetFilter(robot, withQuery('corridor'), siteName)).toBe(true);
    expect(matchesFleetFilter(robot, withQuery('hotel'), siteName)).toBe(true);
    expect(matchesFleetFilter(robot, withQuery('dlv-00'), siteName)).toBe(true);
    expect(matchesFleetFilter(robot, withQuery('scrubber'), siteName)).toBe(false);
  });

  it('applies battery, vendor and site tokens', () => {
    expect(matchesFleetFilter(robot, withQuery('battery:<20'), siteName)).toBe(true);
    expect(matchesFleetFilter(robot, withQuery('battery:<12'), siteName)).toBe(false);
    expect(matchesFleetFilter(robot, withQuery('vendor:nordbot'), siteName)).toBe(false);
    expect(matchesFleetFilter(robot, withQuery('site:isar'), siteName)).toBe(true);
  });
});

describe('fleetSearchMatcher', () => {
  it('parses a typed query once and then matches robots like the fleet search', () => {
    const siteName = () => 'Hotel Isar';
    const matches = fleetSearchMatcher('isar battery:<20', siteName);
    expect(matches(aRobot({ battery: { percent: 12, charging: false } }))).toBe(true);
    expect(matches(aRobot({ battery: { percent: 40, charging: false } }))).toBe(false);
  });
});
