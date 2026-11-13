import { themeStorageKey, type Theme } from '../types/theme';

const isTheme = (value: string | null): value is Theme => value === 'light' || value === 'dark';

export function readPreferredTheme(): Theme {
  try {
    const stored = localStorage.getItem(themeStorageKey);
    if (isTheme(stored)) return stored;
  } catch {
    // Storage can be blocked (private mode, policies); fall through to the system preference.
  }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(themeStorageKey, theme);
  } catch {
    // Not persisting is acceptable; the theme still applies for this visit.
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

export function readAppliedTheme(): Theme {
  const applied = document.documentElement.dataset.theme ?? null;
  return isTheme(applied) ? applied : 'light';
}
