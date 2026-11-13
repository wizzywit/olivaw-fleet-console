'use client';

import { useThemeRepository } from '../repository/themeContext';

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
