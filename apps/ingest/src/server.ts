import { sites } from '@olivaw/demo-world';
import type { AddressInfo } from 'node:net';
import type { IngestConfig } from './config';
import { createVda5050Adapter } from './protocols/vda5050Adapter';
import { createPatchLog } from './store/patchLog';
import { createRobotStore } from './store/robotStore';
import { buildHttpApp } from './transport/httpApp';
import { createLiveHub } from './transport/liveSocket';
import { startMqttBroker } from './transport/mqttBroker';

export interface IngestDeps {
  log: (message: string, data?: Record<string, unknown>) => void;
  now?: () => Date;
}

export interface RunningIngest {
  httpUrl: string;
  wsUrl: string;
  mqttUrl: string;
  close(): Promise<void>;
}

const patchLogCapacity = 120;

export async function startIngest(
  config: IngestConfig,
  { log, now = () => new Date() }: IngestDeps,
): Promise<RunningIngest> {
  const store = createRobotStore(config.domain, { log });
  const patchLog = createPatchLog(patchLogCapacity);
  const liveHub = createLiveHub(patchLog);
  const vda5050 = createVda5050Adapter({ log, now });

  const broker = await startMqttBroker(config.mqttPort, (topic, payload) => {
    const event = vda5050.onMessage(topic, payload);
    if (event === null || event.kind === 'factsheet') return;
    if (event.kind === 'observation') store.applyObservation(event.observation, now());
    else store.applyConnection(event.robotId, event.state, event.at);
  });

  const sweepTimer = setInterval(() => {
    store.sweep(now());
  }, config.sweepIntervalMs);

  const patchTimer = setInterval(() => {
    const { changed, removed } = store.drainChanges();
    if (changed.length === 0 && removed.length === 0) return;
    const patch = {
      type: 'patch' as const,
      sequence: patchLog.nextSequence(),
      robots: changed,
      removed,
      aggregates: store.aggregates(),
    };
    patchLog.append(patch);
    liveHub.broadcast(patch);
  }, config.patchIntervalMs);

  const app = await buildHttpApp({ config, store, patchLog, liveHub, sites, now, log });
  await app.listen({ port: config.httpPort, host: '127.0.0.1' });
  const httpPort = (app.server.address() as AddressInfo).port;

  return {
    httpUrl: `http://127.0.0.1:${httpPort}`,
    wsUrl: `ws://127.0.0.1:${httpPort}`,
    mqttUrl: `mqtt://127.0.0.1:${broker.port}`,
    async close() {
      clearInterval(sweepTimer);
      clearInterval(patchTimer);
      liveHub.closeAll();
      await app.close();
      await broker.close();
    },
  };
}
