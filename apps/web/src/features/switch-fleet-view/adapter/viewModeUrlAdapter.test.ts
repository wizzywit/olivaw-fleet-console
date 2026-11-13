import { readViewMode, replaceViewModeInUrl } from './viewModeUrlAdapter';

describe('view mode url adapter', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('reads grid from the url and falls back to the table', () => {
    expect(readViewMode(new URLSearchParams('view=grid'))).toBe('grid');
    expect(readViewMode(new URLSearchParams('view=cards'))).toBe('table');
    expect(readViewMode(new URLSearchParams())).toBe('table');
  });

  it('writes the view without touching the filters, and leaves the table implicit', () => {
    window.history.replaceState(null, '', '/?status=offline');
    replaceViewModeInUrl('grid');
    expect(window.location.search).toBe('?status=offline&view=grid');
    replaceViewModeInUrl('table');
    expect(window.location.search).toBe('?status=offline');
  });
});
