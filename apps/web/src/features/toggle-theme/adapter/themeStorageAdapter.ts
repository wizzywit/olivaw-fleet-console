import { themeCookieName, type Theme } from '../types/theme';

const oneYearInSeconds = 60 * 60 * 24 * 365;
const systemDarkQuery = '(prefers-color-scheme: dark)';

const isTheme = (value: string | undefined): value is Theme => value === 'light' || value === 'dark';

export interface CookieReader {
  get(name: string): { value: string } | undefined;
}

export function readThemeCookie(cookies: CookieReader): Theme | null {
  const value = cookies.get(themeCookieName)?.value;
  return isTheme(value) ? value : null;
}

export function storeTheme(theme: Theme): void {
  document.cookie = `${themeCookieName}=${theme}; Path=/; Max-Age=${String(oneYearInSeconds)}; SameSite=Lax`;
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

export function readAppliedTheme(): Theme {
  const applied = document.documentElement.dataset.theme;
  if (isTheme(applied)) return applied;
  return matchMedia(systemDarkQuery).matches ? 'dark' : 'light';
}

export function subscribeToSystemTheme(listener: () => void): () => void {
  const query = matchMedia(systemDarkQuery);
  query.addEventListener('change', listener);
  return () => {
    query.removeEventListener('change', listener);
  };
}
