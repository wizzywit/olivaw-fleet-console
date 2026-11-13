import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fleetHandlers } from '@/test/liveHandlers';
import { server } from '@/test/msw';
import { navigation, nextNavigationMock } from '@/test/nextNavigation';
import { renderWithProviders } from '@/test/renderWithProviders';
import { AppHeader } from './AppHeader';

vi.mock('next/navigation', () => nextNavigationMock());

describe('AppHeader', () => {
  beforeEach(() => {
    navigation.search = new URLSearchParams();
    server.use(...fleetHandlers());
  });

  it('links to the attention view with the live count and marks the current page', async () => {
    renderWithProviders(<AppHeader />);
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(await within(nav).findByRole('link', { name: /Needs attention 1/ })).toHaveAttribute(
      'href',
      '/?status=attention',
    );
    expect(within(nav).getByRole('link', { name: 'Fleet' })).toHaveAttribute('aria-current', 'page');
  });

  it('shows the live connection state in words', async () => {
    renderWithProviders(<AppHeader />);
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Live');
    });
  });

  it('pauses and resumes live updates', async () => {
    renderWithProviders(<AppHeader />);
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Live');
    });
    await userEvent.click(screen.getByRole('button', { name: 'Pause live updates' }));
    expect(screen.getByRole('status')).toHaveTextContent('Paused');
    await userEvent.click(screen.getByRole('button', { name: 'Resume live updates' }));
    expect(screen.getByRole('status')).toHaveTextContent('Live');
  });
});
