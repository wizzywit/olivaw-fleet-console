'use client';

import { createContext, useContext, useSyncExternalStore } from 'react';
import { applyTheme, readAppliedTheme, storeTheme } from '../adapter/themeStorageAdapter';
import type { Theme } from '../types/theme';

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// The server cannot know the theme, so it renders the light snapshot; React then switches to the applied
// theme after hydration without a mismatch. Colours never flash: CSS reads data-theme set by the bootstrap script.
export function useThemeController(): ThemeContextValue {
  const theme = useSyncExternalStore(subscribe, readAppliedTheme, () => 'light' as const);
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
