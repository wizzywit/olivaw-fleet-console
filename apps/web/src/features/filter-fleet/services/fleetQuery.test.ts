import { parseFleetQuery } from './fleetQuery';

describe('parseFleetQuery', () => {
  it('reads site, vendor, status and battery tokens and keeps the rest as text', () => {
    expect(parseFleetQuery('dlv site:isar vendor:Kairo status:attention battery:<20 corridor')).toEqual({
      text: 'dlv corridor',
      site: 'isar',
      vendor: 'kairo',
      status: 'attention',
      batteryBelow: 20,
    });
  });

  it('keeps tokens it cannot read as text', () => {
    expect(parseFleetQuery('battery:<abc status:dancing')).toEqual({
      text: 'battery:<abc status:dancing',
      site: null,
      vendor: null,
      status: null,
      batteryBelow: null,
    });
  });

  it('treats an empty query as no filter', () => {
    expect(parseFleetQuery('   ')).toEqual({
      text: '',
      site: null,
      vendor: null,
      status: null,
      batteryBelow: null,
    });
  });
});
