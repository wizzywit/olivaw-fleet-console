import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fleetHandlers } from '@/test/liveHandlers';
import { server } from '@/test/msw';
import { navigation, nextNavigationMock } from '@/test/nextNavigation';
import { renderWithProviders } from '@/test/renderWithProviders';
import { AppHeader } from '../AppHeader/AppHeader';

vi.mock('next/navigation', () => nextNavigationMock());

async function renderLoaded() {
  renderWithProviders(<AppHeader />);
  await screen.findByRole('link', { name: /Needs attention 1/ });
}

async function openPalette() {
  await userEvent.keyboard('{Control>}k{/Control}');
  return screen.findByRole('dialog', { name: 'Command palette' });
}

describe('command palette', () => {
  beforeEach(() => {
    navigation.reset();
    server.use(...fleetHandlers());
  });

  it('opens with Ctrl or Cmd K and opens a robot found by part of its id', async () => {
    await renderLoaded();
    const dialog = await openPalette();
    await userEvent.keyboard('0087');
    const robots = within(dialog).getByRole('group', { name: 'Robots' });
    expect(within(robots).getByRole('menuitem', { name: /DLV-0087/ })).toBeInTheDocument();
    await userEvent.keyboard('{Enter}');
    expect(navigation.push).toHaveBeenCalledWith('/robots/DLV-0087');
  });

  it('applies a status filter on the fleet page and closes', async () => {
    await renderLoaded();
    const dialog = await openPalette();
    await userEvent.keyboard('attention');
    await userEvent.click(within(dialog).getByRole('menuitem', { name: 'Show only Needs attention' }));
    expect(window.location.search).toBe('?status=attention');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('turns the typed text into the fleet search with Tab', async () => {
    await renderLoaded();
    await openPalette();
    await userEvent.keyboard('isar{Tab}');
    expect(window.location.search).toBe('?q=isar');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('switches to the grid and pauses live updates', async () => {
    await renderLoaded();
    let dialog = await openPalette();
    await userEvent.keyboard('grid');
    await userEvent.click(within(dialog).getByRole('menuitem', { name: 'Switch to grid view' }));
    expect(window.location.search).toBe('?view=grid');
    dialog = await openPalette();
    await userEvent.keyboard('pause');
    await userEvent.click(within(dialog).getByRole('menuitem', { name: 'Pause live updates' }));
    expect(await screen.findByRole('button', { name: 'Resume live updates' })).toBeInTheDocument();
  });

  it('offers robots and global actions away from the fleet page, but no fleet filters', async () => {
    navigation.visit('/robots/DLV-0087');
    await renderLoaded();
    const dialog = await openPalette();
    expect(within(dialog).getByRole('menuitem', { name: 'Go to the fleet' })).toBeInTheDocument();
    await userEvent.keyboard('attention');
    expect(within(dialog).queryByRole('menuitem', { name: /Show only/ })).not.toBeInTheDocument();
  });

  it('opens from the button in the search field and returns focus to the search on Escape', async () => {
    await renderLoaded();
    const trigger = screen.getByRole('button', { name: 'Open command palette' });
    await userEvent.click(trigger);
    await screen.findByRole('dialog', { name: 'Command palette' });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole('searchbox', { name: 'Search or filter robots' })).toHaveFocus();
    });
  });
});
