import { createServer } from 'node:net';
import { describe, expect, it } from 'vitest';
import { listeningPort } from './listeningPort';

describe('listeningPort', () => {
  it('reads the port of a listening TCP server', async () => {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    expect(listeningPort(server)).toBeGreaterThan(0);
    server.close();
  });

  it('throws when the server is not listening on a TCP port', () => {
    expect(() => listeningPort(createServer())).toThrow('not listening');
  });
});
