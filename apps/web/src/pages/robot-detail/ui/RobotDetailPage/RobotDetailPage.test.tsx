import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { aPatch, aSnapshotDto, attentionRobotDto } from '@/test/fleetFixtures';
import { fleetHandlers, liveLink } from '@/test/liveHandlers';
import { server } from '@/test/msw';
import { navigation, nextNavigationMock } from '@/test/nextNavigation';
import { renderWithProviders } from '@/test/renderWithProviders';
import { RobotDetailPage } from './RobotDetailPage';

vi.mock('next/navigation', () => nextNavigationMock());

const isarMap = {
  id: 'isar-f4',
  name: 'Floor 4',
  width: 60,
  height: 20,
  zones: [{ id: 'corridor', name: 'Corridor', x: 0, y: 8, width: 60, height: 4 }],
  docks: [{ id: 'isar-dock-1', x: 4, y: 16 }],
};

const snapshot = aSnapshotDto({
  sites: [
    { id: 'airport-t2', name: 'Airport T2', maps: [] },
    { id: 'hotel-isar', name: 'Hotel Isar', maps: [isarMap] },
  ],
});

const detail = {
  ...attentionRobotDto,
  serialNumber: 'KC1-22-0087',
  errors: [{ level: 'warning', code: 'BATTERY_LOW', description: 'Battery below 20%' }],
  rawMessage: { protocol: 'vda5050', receivedAt: '2026-11-13T10:00:00.000Z', payload: { headerId: 88213 } },
};

describe('robot detail', () => {
  beforeEach(() => {
    navigation.reset();
    server.use(
      ...fleetHandlers(snapshot),
      http.get('*/api/robots/DLV-0087', () => HttpResponse.json(detail)),
      http.get('*/api/robots/UNKNOWN', () => HttpResponse.json({ error: 'not-found' }, { status: 404 })),
    );
  });

  it('shows who the robot is, why it needs attention, where it is and what it reported', async () => {
    renderWithProviders(<RobotDetailPage robotId="DLV-0087" />);
    expect(await screen.findByRole('heading', { name: 'DLV-0087', level: 1 })).toBeInTheDocument();
    expect(screen.getAllByText('Needs attention').length).toBeGreaterThan(0);
    expect(screen.getByRole('alert')).toHaveTextContent('Battery critical');
    expect(screen.getByRole('img', { name: /in Corridor, at x 41.2 m, y 8.7 m/ })).toBeInTheDocument();
    expect(await screen.findByText(/serial KC1-22-0087/)).toBeInTheDocument();
    const raw = screen.getByText(/Raw message · VDA 5050 3.0/).closest('details');
    expect(raw).not.toHaveAttribute('open');
  });

  it('updates in place when the robot goes offline', async () => {
    server.use(
      liveLink.addEventListener('connection', ({ client }) => {
        client.addEventListener('message', () => {
          client.send(
            JSON.stringify(aPatch(11, [{ id: 'DLV-0087', status: 'offline', attentionReasons: [] }])),
          );
        });
      }),
    );
    renderWithProviders(<RobotDetailPage robotId="DLV-0087" />);
    await waitFor(() => {
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'DLV-0087', level: 1 })).toBeInTheDocument();
  });

  it('says when a robot is unknown and links back to the fleet', async () => {
    renderWithProviders(<RobotDetailPage robotId="UNKNOWN" />);
    expect(await screen.findByRole('heading', { name: 'Robot not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the fleet' })).toHaveAttribute('href', '/');
  });

  it('sends a robot to its dock', async () => {
    let command: unknown;
    server.use(
      http.post('*/api/robots/DLV-0087/commands', async ({ request }) => {
        command = await request.json();
        return HttpResponse.json({ accepted: true }, { status: 202 });
      }),
    );
    renderWithProviders(<RobotDetailPage robotId="DLV-0087" />);
    const button = await screen.findByRole('button', { name: 'Send to dock' });
    await waitFor(() => {
      expect(button).toBeEnabled();
    });
    await userEvent.click(button);
    expect(await screen.findByText('Sent to dock')).toBeInTheDocument();
    expect(command).toEqual({ type: 'send-to-dock' });
  });

  it('disables commands while the live connection is down', async () => {
    let connections = 0;
    server.use(
      liveLink.addEventListener('connection', ({ client }) => {
        connections += 1;
        if (connections === 1) client.close();
      }),
    );
    renderWithProviders(<RobotDetailPage robotId="DLV-0087" />);
    expect(
      await screen.findByText('Commands are disabled until the live connection is back'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send to dock' })).toBeDisabled();
  });
});
