import { createConnection } from 'node:net';

const canConnect = (host: string, port: number) =>
  new Promise<boolean>((resolve) => {
    const socket = createConnection({ host, port });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
  });

// pnpm dev starts the simulator next to ingest; waiting for the broker port avoids one failed connect per robot.
export async function waitForBroker(
  brokerUrl: string,
  { retryMs = 250, log }: { retryMs?: number; log: (message: string) => void },
): Promise<void> {
  const url = new URL(brokerUrl);
  const port = Number(url.port || 1883);
  let saidWaiting = false;
  while (!(await canConnect(url.hostname, port))) {
    if (!saidWaiting) {
      log(`waiting for the broker at ${brokerUrl}`);
      saidWaiting = true;
    }
    await new Promise((resolve) => setTimeout(resolve, retryMs));
  }
}
