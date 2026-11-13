import { createServer, type Server } from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitForBroker } from './brokerReady';

describe('waitForBroker', () => {
  let server: Server | undefined;

  afterEach(async () => {
    await new Promise<void>((resolve) => {
      if (server === undefined) resolve();
      else
        server.close(() => {
          resolve();
        });
    });
    server = undefined;
  });

  it('waits until the broker accepts connections and says so once', async () => {
    const probe = createServer();
    await new Promise<void>((resolve) => probe.listen(0, '127.0.0.1', resolve));
    const address = probe.address();
    const port = typeof address === 'object' && address !== null ? address.port : 0;
    await new Promise<void>((resolve) => {
      probe.close(() => {
        resolve();
      });
    });

    const log = vi.fn();
    const ready = waitForBroker(`mqtt://127.0.0.1:${String(port)}`, { retryMs: 20, log });
    await new Promise((resolve) => setTimeout(resolve, 100));
    server = createServer((socket) => socket.end());
    await new Promise<void>((resolve) => server?.listen(port, '127.0.0.1', resolve));

    await expect(ready).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(`waiting for the broker at mqtt://127.0.0.1:${String(port)}`);
  });

  it('returns at once when the broker is already up', async () => {
    server = createServer((socket) => socket.end());
    await new Promise<void>((resolve) => server?.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    const port = typeof address === 'object' && address !== null ? address.port : 0;
    const log = vi.fn();
    await waitForBroker(`mqtt://127.0.0.1:${String(port)}`, { retryMs: 20, log });
    expect(log).not.toHaveBeenCalled();
  });
});
