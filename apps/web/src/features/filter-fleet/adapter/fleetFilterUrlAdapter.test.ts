import { fromSearchParams, toSearchParams } from './fleetFilterUrlAdapter';

describe('fleet filter url adapter', () => {
  it('round-trips filter params through the url', () => {
    const params = new URLSearchParams('status=attention&site=hotel-isar&q=battery%3A%3C20');
    const filter = fromSearchParams(params);
    expect(filter).toEqual({ status: 'attention', siteId: 'hotel-isar', rawQuery: 'battery:<20' });
    expect(toSearchParams(filter).toString()).toBe(params.toString());
  });

  it('falls back to defaults for unknown values and omits defaults from the url', () => {
    expect(fromSearchParams(new URLSearchParams('status=sleeping'))).toEqual({
      status: 'all',
      siteId: null,
      rawQuery: '',
    });
    expect(toSearchParams({ status: 'all', siteId: null, rawQuery: '' }).toString()).toBe('');
  });
});
