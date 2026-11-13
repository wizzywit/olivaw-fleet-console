import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fleetHandlers, liveLink } from '@/test/liveHandlers';
import { server } from '@/test/msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import { LiveConnectionBanner } from './LiveConnectionBanner';

describe('LiveConnectionBanner', () => {
  it('stays hidden while live', async () => {
    server.use(...fleetHandlers());
    renderWithProviders(<LiveConnectionBanner />);
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)));
    expect(screen.queryByText('Live updates paused')).not.toBeInTheDocument();
  });

  it('explains that data is old when the connection drops, and retries on request', async () => {
    let connections = 0;
    server.use(
      ...fleetHandlers(),
      liveLink.addEventListener('connection', ({ client }) => {
        connections += 1;
        if (connections === 1) client.close();
      }),
    );
    renderWithProviders(<LiveConnectionBanner />);
    expect(await screen.findByText('Live updates paused')).toBeInTheDocument();
    expect(screen.getByText(/Commands are disabled until the connection is back/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry now' }));
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)));
    expect(connections).toBe(2);
  });
});
