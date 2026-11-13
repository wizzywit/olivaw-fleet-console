'use client';

import { createContext, useContext, useState } from 'react';
import { applyTheme, readAppliedTheme, storeTheme } from '../adapter/themeStorageAdapter';
import type { Theme } from '../types/theme';

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

// Creates the value the app puts into ThemeContext. The bootstrap script has already applied the theme before
// React runs, so this only reads it.
export function useThemeController(): ThemeContextValue {
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof document === 'undefined' ? 'light' : readAppliedTheme(),
  );
  return {
    theme,
    setTheme: (next) => {
      applyTheme(next);
      storeTheme(next);
      setThemeState(next);
    },
  };
}

export function useThemeRepository(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === null) throw new Error('useThemeRepository needs ThemeContext from the app providers');
  return context;
}
