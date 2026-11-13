'use client';

import { useThemeRepository } from '../repository/useThemeRepository';

export function useThemeToggle() {
  const { theme, setTheme } = useThemeRepository();
  const next = theme === 'dark' ? 'light' : 'dark';
  return {
    label: `Switch to ${next} theme`,
    isDark: theme === 'dark',
    toggle: () => {
      setTheme(next);
    },
  };
}
