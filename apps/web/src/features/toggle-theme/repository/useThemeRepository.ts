'use client';

import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from './ThemeProvider';

export function useThemeRepository(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === null) throw new Error('useThemeRepository must be used inside ThemeProvider');
  return context;
}
