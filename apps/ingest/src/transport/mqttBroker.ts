import { Aedes } from 'aedes';
import { createServer } from 'node:net';
import { listeningPort } from './listeningPort';

export interface RunningBroker {
  port: number;
  close(): Promise<void>;
}

export async function startMqttBroker(
  port: number,
  onPublish: (topic: string, payload: Buffer) => void,
): Promise<RunningBroker> {
  const broker = await Aedes.createBroker();
  broker.on('publish', (packet) => {
    if (packet.topic.startsWith('$SYS')) return;
    onPublish(packet.topic, Buffer.from(packet.payload));
  });

  const server = createServer(broker.handle);
  await new Promise<void>((resolve) => server.listen(port, resolve));

  return {
    port: listeningPort(server),
    close: () =>
      new Promise<void>((resolve) => {
        broker.close(() => {
          server.close(() => {
            resolve();
          });
        });
      }),
  };
}
