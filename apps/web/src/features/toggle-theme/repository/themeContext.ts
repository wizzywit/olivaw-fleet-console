'use client';

import { createContext, useContext, useSyncExternalStore } from 'react';
import {
  applyTheme,
  readAppliedTheme,
  storeTheme,
  subscribeToSystemTheme,
} from '../adapter/themeStorageAdapter';
import type { Theme } from '../types/theme';

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  const unsubscribeSystem = subscribeToSystemTheme(listener);
  return () => {
    listeners.delete(listener);
    unsubscribeSystem();
  };
};

// The server renders the theme from the request cookie. Without a cookie it assumes light while CSS already
// follows the system preference, and React switches the toggle to the real theme right after hydration.
export function useThemeController(serverTheme: Theme | null): ThemeContextValue {
  const theme = useSyncExternalStore(subscribe, readAppliedTheme, () => serverTheme ?? 'light');
  return {
    theme,
    setTheme: (next) => {
      applyTheme(next);
      storeTheme(next);
      for (const listener of listeners) listener();
    },
  };
}

export function useThemeRepository(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === null) throw new Error('useThemeRepository needs ThemeContext from the app providers');
  return context;
}
