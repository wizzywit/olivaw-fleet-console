import { replaceSearchParams } from './searchParams';

describe('replaceSearchParams', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('replaces only the keys its caller owns and keeps the rest', () => {
    window.history.replaceState(null, '', '/?view=grid&status=offline');
    replaceSearchParams(['status', 'site'], new URLSearchParams('site=hotel-isar'));
    expect(window.location.search).toBe('?view=grid&site=hotel-isar');
  });

  it('drops the question mark when nothing is left', () => {
    window.history.replaceState(null, '', '/robots?status=offline');
    replaceSearchParams(['status'], new URLSearchParams());
    expect(window.location.pathname + window.location.search).toBe('/robots');
  });
});
