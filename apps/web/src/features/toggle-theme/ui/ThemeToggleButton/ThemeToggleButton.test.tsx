import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeContext, useThemeController } from '../../repository/themeContext';
import { ThemeToggleButton } from './ThemeToggleButton';

function WithTheme({ children }: { children: React.ReactNode }) {
  return <ThemeContext.Provider value={useThemeController()}>{children}</ThemeContext.Provider>;
}

describe('ThemeToggleButton', () => {
  it('switches between light and dark and says what it will do', async () => {
    document.documentElement.dataset.theme = 'light';
    render(
      <WithTheme>
        <ThemeToggleButton />
      </WithTheme>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument();
  });
});

describe('ThemeToggleButton hydration', () => {
  it('renders the server snapshot first, so server and client markup match', async () => {
    const { renderToString } = await import('react-dom/server');
    document.documentElement.dataset.theme = 'dark';
    const html = renderToString(
      <WithTheme>
        <ThemeToggleButton />
      </WithTheme>,
    );
    expect(html).toContain('Switch to dark theme');
  });
});
