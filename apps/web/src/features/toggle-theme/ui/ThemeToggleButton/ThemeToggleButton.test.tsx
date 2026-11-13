import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { ThemeContext, useThemeController } from '../../repository/themeContext';
import type { Theme } from '../../types/theme';
import { ThemeToggleButton } from './ThemeToggleButton';

function WithTheme({ serverTheme, children }: { serverTheme: Theme | null; children: ReactNode }) {
  return <ThemeContext.Provider value={useThemeController(serverTheme)}>{children}</ThemeContext.Provider>;
}

describe('ThemeToggleButton', () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme;
  });

  it('switches between light and dark, remembers the choice and says what it will do', async () => {
    document.documentElement.dataset.theme = 'light';
    render(
      <WithTheme serverTheme="light">
        <ThemeToggleButton />
      </WithTheme>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.cookie).toContain('olivaw-theme=dark');
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument();
  });
});

describe('ThemeToggleButton on the server', () => {
  it('renders the theme from the request cookie, so server and client markup match', async () => {
    const { renderToString } = await import('react-dom/server');
    const html = renderToString(
      <WithTheme serverTheme="dark">
        <ThemeToggleButton />
      </WithTheme>,
    );
    expect(html).toContain('Switch to light theme');
  });
});
