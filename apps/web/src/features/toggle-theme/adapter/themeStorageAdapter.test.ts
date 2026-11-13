import { applyTheme, readPreferredTheme, storeTheme } from './themeStorageAdapter';

describe('theme storage adapter', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('prefers a stored choice', () => {
    storeTheme('dark');
    expect(readPreferredTheme()).toBe('dark');
  });

  it('falls back to the system preference when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('dark') }));
    expect(readPreferredTheme()).toBe('dark');
    vi.unstubAllGlobals();
  });

  it('applies the theme to the document', () => {
    applyTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
