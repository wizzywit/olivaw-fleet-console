import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { aPatch, aSnapshotDto } from '@/test/fleetFixtures';
import { fleetHandlers, liveLink } from '@/test/liveHandlers';
import { server } from '@/test/msw';
import { navigation, nextNavigationMock } from '@/test/nextNavigation';
import { renderWithProviders } from '@/test/renderWithProviders';
import { FleetOverviewPage } from './FleetOverviewPage';

vi.mock('next/navigation', () => nextNavigationMock());

const robotRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);
const rowFor = (id: string) => screen.getByRole('rowheader', { name: new RegExp(id) }).closest('tr');

function sendOnHello(...messages: unknown[]) {
  server.use(
    liveLink.addEventListener('connection', ({ client }) => {
      client.addEventListener('message', () => {
        for (const message of messages) client.send(JSON.stringify(message));
      });
    }),
  );
}

describe('fleet overview', () => {
  beforeEach(() => {
    navigation.reset();
    server.use(...fleetHandlers());
  });

  it('shows the sites, the attention group with its priority and action, and the robots by urgency', async () => {
    renderWithProviders(<FleetOverviewPage />);
    expect(await screen.findByRole('button', { name: /Airport T2/ })).toBeInTheDocument();
    const attention = screen.getByRole('region', { name: /Needs your attention/ });
    expect(within(attention).getByText(/Battery critical · 1 robot/)).toBeInTheDocument();
    expect(within(attention).getByText('High priority')).toBeInTheDocument();
    expect(within(attention).getByText('Send the robot to a dock')).toBeInTheDocument();
    expect(robotRows().map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
      expect.stringContaining('DLV-0087'),
      expect.stringContaining('CLN-0142'),
    ]);
  });

  it('narrows the list with the status chips and keeps the choice in the url', async () => {
    renderWithProviders(<FleetOverviewPage />);
    await userEvent.click(await screen.findByRole('radio', { name: /Needs attention/ }));
    expect(navigation.replace).toHaveBeenLastCalledWith('/?status=attention', { scroll: false });
    await waitFor(() => {
      expect(robotRows()).toHaveLength(1);
    });
    expect(rowFor('DLV-0087')).not.toBeNull();
  });

  it('updates a robot in place when a live patch arrives', async () => {
    sendOnHello(aPatch(11, [{ id: 'CLN-0142', batteryPercent: 50 }]));
    renderWithProviders(<FleetOverviewPage />);
    await waitFor(() => {
      expect(
        within(rowFor('CLN-0142') ?? document.body).getByRole('meter', { name: 'Battery 50%' }),
      ).toBeInTheDocument();
    });
  });

  it('holds the order while the user works in the list and re-sorts on request', async () => {
    sendOnHello(
      aPatch(11, [{ id: 'CLN-0142', status: 'attention', attentionReasons: ['stuck'], batteryPercent: 5 }]),
    );
    renderWithProviders(<FleetOverviewPage />);
    const region = await screen.findByRole('region', { name: 'Robots, sorted by urgency' });
    region.focus();
    expect(await screen.findByText(/Order paused while you work · 2 updates/)).toBeInTheDocument();
    expect(within(robotRows()[0] ?? document.body).getByRole('rowheader')).toHaveTextContent('DLV-0087');
    await userEvent.click(screen.getByRole('button', { name: 'Re-sort' }));
    expect(within(robotRows()[0] ?? document.body).getByRole('rowheader')).toHaveTextContent('CLN-0142');
  });

  it('announces the active row to screen readers while moving with the keyboard', async () => {
    renderWithProviders(<FleetOverviewPage />);
    const region = await screen.findByRole('region', { name: 'Robots, sorted by urgency' });
    await userEvent.click(region);
    expect(screen.getByTestId('robot-table-announcement')).toHaveTextContent(
      'Row 1 of 2: DLV-0087, Needs attention, battery 12%',
    );
    await userEvent.keyboard('j');
    expect(screen.getByTestId('robot-table-announcement')).toHaveTextContent(
      'Row 2 of 2: CLN-0142, Working, battery 78%',
    );
    expect(screen.getByRole('columnheader', { name: 'Status' })).not.toHaveAttribute('aria-sort');
  });

  it('explains an empty result and clears the filters', async () => {
    navigation.search = new URLSearchParams('q=nothing-matches-this');
    renderWithProviders(<FleetOverviewPage />);
    expect(await screen.findByRole('heading', { name: 'No robots match these filters' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(navigation.replace).toHaveBeenLastCalledWith('/', { scroll: false });
  });

  it('offers a retry when the fleet cannot be loaded', async () => {
    server.use(http.get('*/api/fleet', () => new HttpResponse(null, { status: 503 })));
    renderWithProviders(<FleetOverviewPage />);
    expect(await screen.findByRole('heading', { name: 'The fleet could not be loaded' })).toBeInTheDocument();
    server.use(http.get('*/api/fleet', () => HttpResponse.json(aSnapshotDto())));
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('button', { name: /Airport T2/ })).toBeInTheDocument();
  });
});
