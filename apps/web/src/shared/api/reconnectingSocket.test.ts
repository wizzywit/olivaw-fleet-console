import { ws } from 'msw';
import { server } from '@/test/msw';
import { createReconnectingSocket, type SocketStatus } from './reconnectingSocket';

const url = 'ws://ingest.test/live';
const live = ws.link(url);

const waitFor = async (condition: () => boolean) => {
  for (let i = 0; i < 100 && !condition(); i += 1) await new Promise((resolve) => setTimeout(resolve, 10));
  if (!condition()) throw new Error('condition not met');
};

describe('createReconnectingSocket', () => {
  it('says hello on open and passes messages on', async () => {
    const received: string[] = [];
    server.use(
      live.addEventListener('connection', ({ client }) => {
        client.addEventListener('message', (event) => {
          client.send(`echo:${typeof event.data === 'string' ? event.data : ''}`);
        });
      }),
    );
    const socket = createReconnectingSocket({
      url,
      onOpen: (send) => {
        send('hello');
      },
      onMessage: (data) => received.push(data),
      onStatus: () => undefined,
    });
    await waitFor(() => received.length > 0);
    expect(received).toEqual(['echo:hello']);
    socket.close();
  });

  it('reports reconnecting with a delay after the server closes, and retryNow reconnects at once', async () => {
    let connections = 0;
    const statuses: [SocketStatus, number | null][] = [];
    server.use(
      live.addEventListener('connection', ({ client }) => {
        connections += 1;
        if (connections === 1) client.close();
      }),
    );
    const socket = createReconnectingSocket({
      url,
      onOpen: () => undefined,
      onMessage: () => undefined,
      onStatus: (status, retryInMs) => statuses.push([status, retryInMs]),
      backoff: () => 60_000,
    });
    await waitFor(() => statuses.some(([status]) => status === 'reconnecting'));
    expect(statuses).toContainEqual(['reconnecting', 60_000]);
    socket.retryNow();
    await waitFor(() => connections === 2);
    socket.close();
    expect(statuses.at(-1)?.[0]).toBe('closed');
  });
});
