import { screen } from '@testing-library/react';
import { http, HttpResponse, ws } from 'msw';
import { aRobotDto, aSnapshotDto } from '@/test/fleetFixtures';
import { server } from '@/test/msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import { useFleetRepository, useFleetRobot } from './useFleet';

function Battery() {
  useFleetRepository();
  const robot = useFleetRobot('CLN-0142');
  return <p>{robot === undefined ? 'loading' : `battery ${robot.battery.percent}`}</p>;
}

describe('fleet live connection', () => {
  it('refetches and reseeds the snapshot when the server asks for a resync', async () => {
    let snapshotRequests = 0;
    const live = ws.link('ws://127.0.0.1:4000/live');
    server.use(
      http.get('*/api/fleet', () => {
        snapshotRequests += 1;
        return HttpResponse.json(
          snapshotRequests === 1
            ? aSnapshotDto()
            : aSnapshotDto({ sequence: 2, robots: [aRobotDto({ batteryPercent: 33 })] }),
        );
      }),
      live.addEventListener('connection', ({ client }) => {
        client.addEventListener('message', () => {
          if (snapshotRequests === 1) client.send(JSON.stringify({ type: 'resync' }));
        });
      }),
    );

    renderWithProviders(<Battery />);

    expect(await screen.findByText('battery 78')).toBeInTheDocument();
    expect(await screen.findByText('battery 33')).toBeInTheDocument();
    expect(snapshotRequests).toBe(2);
  });
});
