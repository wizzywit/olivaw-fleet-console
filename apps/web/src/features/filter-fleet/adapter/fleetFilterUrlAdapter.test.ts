import { fromSearchParams, replaceFilterInUrl, toSearchParams } from './fleetFilterUrlAdapter';

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

  it('keeps parameters it does not own, such as the view', () => {
    window.history.replaceState(null, '', '/?view=grid&status=offline');
    replaceFilterInUrl({ status: 'attention', siteId: null, rawQuery: '' });
    expect(window.location.search).toBe('?view=grid&status=attention');
    window.history.replaceState(null, '', '/');
  });
});
