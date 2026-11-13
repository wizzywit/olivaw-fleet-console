import { applyTheme, readAppliedTheme, readThemeCookie, storeTheme } from './themeStorageAdapter';

const cookieStore = (value?: string) => ({
  get: (name: string) => (name === 'olivaw-theme' && value !== undefined ? { value } : undefined),
});

describe('theme storage adapter', () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme;
    document.cookie = 'olivaw-theme=; Path=/; Max-Age=0';
    vi.unstubAllGlobals();
  });

  it('stores the choice in a cookie the server can read on the next request', () => {
    storeTheme('dark');
    expect(document.cookie).toContain('olivaw-theme=dark');
  });

  it('reads a stored choice from the request cookies and ignores anything else', () => {
    expect(readThemeCookie(cookieStore('dark'))).toBe('dark');
    expect(readThemeCookie(cookieStore('purple'))).toBeNull();
    expect(readThemeCookie(cookieStore())).toBeNull();
  });

  it('applies the theme to the document', () => {
    applyTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('follows the system preference while no theme is applied', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('dark') }));
    expect(readAppliedTheme()).toBe('dark');
    applyTheme('light');
    expect(readAppliedTheme()).toBe('light');
  });
});
