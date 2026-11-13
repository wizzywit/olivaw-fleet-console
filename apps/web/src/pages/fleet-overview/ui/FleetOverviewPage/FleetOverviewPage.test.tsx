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

  it('shows how many robots in a group nobody has acknowledged, and acknowledges them for every console', async () => {
    let marked: unknown;
    server.use(
      http.post('*/api/attention-groups/battery-critical/acknowledge', async ({ request }) => {
        marked = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderWithProviders(<FleetOverviewPage />);
    const attention = await screen.findByRole('region', { name: /Needs your attention/ });
    expect(within(attention).getByText('1 unacknowledged')).toBeInTheDocument();
    await userEvent.click(within(attention).getByRole('button', { name: 'Acknowledge Battery critical' }));
    expect(marked).toEqual({ robotIds: ['DLV-0087'] });
  });

  it('shows a group as all acknowledged once the server reports none unacknowledged', async () => {
    server.use(
      ...fleetHandlers(
        aSnapshotDto({
          aggregates: {
            ...aSnapshotDto().aggregates,
            attentionGroups: aSnapshotDto().aggregates.attentionGroups.map((group) => ({
              ...group,
              unacknowledgedCount: 0,
            })),
          },
        }),
      ),
    );
    renderWithProviders(<FleetOverviewPage />);
    const attention = await screen.findByRole('region', { name: /Needs your attention/ });
    expect(await within(attention).findByText('All acknowledged')).toBeInTheDocument();
    expect(within(attention).queryByRole('button', { name: /^Acknowledge/ })).not.toBeInTheDocument();
  });

  it('says when an acknowledgement could not be saved', async () => {
    server.use(
      http.post(
        '*/api/attention-groups/battery-critical/acknowledge',
        () => new HttpResponse(null, { status: 503 }),
      ),
    );
    renderWithProviders(<FleetOverviewPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Acknowledge Battery critical' }));
    expect(await screen.findByText('Not saved. Try again.')).toBeInTheDocument();
  });

  it('narrows the list with the status chips and keeps the choice in the url', async () => {
    renderWithProviders(<FleetOverviewPage />);
    await userEvent.click(await screen.findByRole('radio', { name: /Needs attention/ }));
    expect(window.location.search).toBe('?status=attention');
    expect(navigation.replace).not.toHaveBeenCalled();
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

  it('switches between table and grid, keeps the choice in the url, and toggles with g', async () => {
    renderWithProviders(<FleetOverviewPage />);
    const views = await screen.findByRole('radiogroup', { name: 'View' });
    await userEvent.click(within(views).getByRole('radio', { name: 'Grid' }));
    expect(window.location.search).toBe('?view=grid');
    expect(within(views).getByRole('radio', { name: 'Grid' })).toBeChecked();
    await userEvent.keyboard('g');
    expect(window.location.search).toBe('');
    expect(within(views).getByRole('radio', { name: 'Table' })).toBeChecked();
  });

  it('opens the grid when the url asks for it', async () => {
    navigation.visit('/?view=grid');
    renderWithProviders(<FleetOverviewPage />);
    const views = await screen.findByRole('radiogroup', { name: 'View' });
    expect(within(views).getByRole('radio', { name: 'Grid' })).toBeChecked();
  });

  it('shows the grid grouped by site with one tab stop, and announces and opens robots from the keyboard', async () => {
    navigation.visit('/?view=grid');
    renderWithProviders(<FleetOverviewPage />);
    const grid = await screen.findByRole('region', { name: 'Robots grid, grouped by site' });
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(grid).toHaveAttribute('tabindex', '0');
    await userEvent.click(grid);
    const announcement = screen.getByTestId('robot-grid-announcement');
    expect(announcement).toHaveTextContent('Airport T2, 1 of 1: CLN-0142, Working, battery 78%');
    await userEvent.keyboard('{ArrowDown}');
    expect(announcement).toHaveTextContent('Hotel Isar, 1 of 1: DLV-0087, Needs attention, battery 12%');
    await userEvent.keyboard('{Enter}');
    expect(navigation.push).toHaveBeenCalledWith('/robots/DLV-0087');
  });

  it('holds the grid order while the user works in it, like the table', async () => {
    sendOnHello(
      aPatch(11, [{ id: 'CLN-0142', status: 'attention', attentionReasons: ['stuck'], batteryPercent: 5 }]),
    );
    navigation.visit('/?view=grid');
    renderWithProviders(<FleetOverviewPage />);
    const grid = await screen.findByRole('region', { name: 'Robots grid, grouped by site' });
    grid.focus();
    expect(await screen.findByText(/Order paused while you work/)).toBeInTheDocument();
  });

  it('explains an empty result and clears the filters', async () => {
    navigation.visit('/?q=nothing-matches-this');
    renderWithProviders(<FleetOverviewPage />);
    expect(await screen.findByRole('heading', { name: 'No robots match these filters' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(window.location.search).toBe('');
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
