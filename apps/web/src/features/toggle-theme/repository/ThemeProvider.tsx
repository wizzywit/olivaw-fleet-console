'use client';

import { createContext, useState, type ReactNode } from 'react';
import { applyTheme, readAppliedTheme, storeTheme } from '../adapter/themeStorageAdapter';
import type { Theme } from '../types/theme';

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

// The bootstrap script has already applied the right theme before React runs, so this only reads it.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof document === 'undefined' ? 'light' : readAppliedTheme(),
  );
  const setTheme = (next: Theme) => {
    applyTheme(next);
    storeTheme(next);
    setThemeState(next);
  };
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
