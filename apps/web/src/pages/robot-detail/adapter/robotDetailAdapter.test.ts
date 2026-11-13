import { http, HttpResponse } from 'msw';
import { aRobotDto } from '@/test/fleetFixtures';
import { server } from '@/test/msw';
import { fetchRobotDetail, sendRobotCommand } from './robotDetailAdapter';

const detailDto = {
  ...aRobotDto(),
  serialNumber: 'CLN-0142',
  errors: [{ level: 'urgent', code: 'BATTERY_LOW', description: null }],
  rawMessage: { protocol: 'vda5050', receivedAt: '2026-11-13T10:00:00.000Z', payload: { headerId: 1 } },
};

describe('robot detail adapter', () => {
  it('maps the detail-only fields', async () => {
    server.use(http.get('*/api/robots/CLN-0142', () => HttpResponse.json(detailDto)));
    await expect(fetchRobotDetail('CLN-0142')).resolves.toEqual({
      serialNumber: 'CLN-0142',
      errors: [{ level: 'urgent', code: 'BATTERY_LOW', description: null }],
      rawMessage: {
        protocol: 'vda5050',
        receivedAt: new Date('2026-11-13T10:00:00.000Z'),
        payload: { headerId: 1 },
      },
    });
  });

  it('returns null for a robot the server does not know', async () => {
    server.use(
      http.get('*/api/robots/UNKNOWN', () => HttpResponse.json({ error: 'not-found' }, { status: 404 })),
    );
    await expect(fetchRobotDetail('UNKNOWN')).resolves.toBeNull();
  });

  it('posts a command', async () => {
    let body: unknown;
    server.use(
      http.post('*/api/robots/CLN-0142/commands', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ accepted: true }, { status: 202 });
      }),
    );
    await sendRobotCommand('CLN-0142', 'send-to-dock');
    expect(body).toEqual({ type: 'send-to-dock' });
  });
});
