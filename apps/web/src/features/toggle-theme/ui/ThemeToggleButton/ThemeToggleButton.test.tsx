import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../../repository/ThemeProvider';
import { ThemeToggleButton } from './ThemeToggleButton';

describe('ThemeToggleButton', () => {
  it('switches between light and dark and says what it will do', async () => {
    document.documentElement.dataset.theme = 'light';
    render(
      <ThemeProvider>
        <ThemeToggleButton />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument();
  });
});
