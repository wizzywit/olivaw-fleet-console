import {
  fleetSnapshotDtoSchema,
  liveServerMessageSchema,
  robotDetailDtoSchema,
  type LiveServerMessage,
} from '@olivaw/contracts';
import broken from '@olivaw/protocols/fixtures/connection.broken.json';
import factsheet from '@olivaw/protocols/fixtures/factsheet.json';
import working from '@olivaw/protocols/fixtures/state.working.json';
import mqtt, { type MqttClient } from 'mqtt';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config';
import { startIngest, type RunningIngest } from '../src/server';

const base = 'vda5050/v3/Nordbot/CLN-0142';
const brokenWill = JSON.stringify({ ...broken, manufacturer: 'Nordbot', serialNumber: 'CLN-0142' });

async function waitFor<T>(probe: () => Promise<T | undefined> | T | undefined, timeoutMs = 2000): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await probe();
    if (value !== undefined) return value;
    if (Date.now() > deadline) throw new Error('timed out waiting for condition');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

function openLive(url: string, lastSequence: number | null, instanceId: string | null = null) {
  const messages: LiveServerMessage[] = [];
  const socket = new WebSocket(url);
  socket.addEventListener('open', () => {
    socket.send(JSON.stringify({ type: 'hello', lastSequence, instanceId }));
  });
  socket.addEventListener('message', (event) => {
    messages.push(liveServerMessageSchema.parse(JSON.parse(String(event.data))));
  });
  return { socket, messages };
}

describe('ingest service', () => {
  let ingest: RunningIngest;
  let robot: MqttClient;

  beforeEach(async () => {
    const config = loadConfig({
      MQTT_PORT: '0',
      HTTP_PORT: '0',
      REPORT_INTERVAL_MS: '100',
      PATCH_INTERVAL_MS: '50',
      SWEEP_INTERVAL_MS: '50',
      HEARTBEAT_INTERVAL_MS: '100',
    });
    ingest = await startIngest(config, { log: () => undefined });
    robot = await mqtt.connectAsync(ingest.mqttUrl, {
      clientId: 'CLN-0142',
      will: { topic: `${base}/connection`, payload: Buffer.from(brokenWill), qos: 1, retain: true },
    });
    await robot.publishAsync(`${base}/factsheet`, JSON.stringify(factsheet), { qos: 1 });
    await robot.publishAsync(`${base}/state`, JSON.stringify(working), { qos: 1 });
  });

  afterEach(async () => {
    robot.end(true);
    await ingest.close();
  });

  const getFleet = async () =>
    fleetSnapshotDtoSchema.parse(await (await fetch(`${ingest.httpUrl}/api/fleet`)).json());

  it('serves the fleet snapshot with config and sites', async () => {
    const fleet = await waitFor(async () => {
      const snapshot = await getFleet();
      return snapshot.robots.length === 1 ? snapshot : undefined;
    });
    expect(fleet.robots[0]).toMatchObject({ id: 'CLN-0142', model: 'Scrubber S2', batteryPercent: 78 });
    expect(fleet.config).toEqual({
      staleAfterMs: 300,
      criticalBatteryPercent: 15,
      stuckAfterMs: 120_000,
      patchIntervalMs: 50,
    });
    expect(fleet.sites).toHaveLength(3);
  });

  it('streams a patch when a robot reports a new value', async () => {
    const fleet = await waitFor(async () => {
      const snapshot = await getFleet();
      return snapshot.robots.length === 1 ? snapshot : undefined;
    });
    const live = openLive(`${ingest.wsUrl}/live`, fleet.sequence);
    await waitFor(() => (live.socket.readyState === WebSocket.OPEN ? true : undefined));
    await robot.publishAsync(
      `${base}/state`,
      JSON.stringify({ ...working, headerId: 1202, powerSupply: { stateOfCharge: 50, charging: false } }),
      { qos: 1 },
    );
    const patch = await waitFor(() =>
      live.messages.find(
        (message) => message.type === 'patch' && message.robots.some((r) => r.batteryPercent === 50),
      ),
    );
    expect(patch.type === 'patch' && patch.aggregates.byStatus.working).toBe(1);
    live.socket.close();
  });

  it('marks a robot offline when its connection breaks', async () => {
    await waitFor(async () => ((await getFleet()).robots.length === 1 ? true : undefined));
    const live = openLive(`${ingest.wsUrl}/live`, null);
    await waitFor(() => (live.socket.readyState === WebSocket.OPEN ? true : undefined));
    robot.stream.destroy();
    await waitFor(() =>
      live.messages.find(
        (message) => message.type === 'patch' && message.robots.some((r) => r.status === 'offline'),
      ),
    );
    live.socket.close();
  });

  it('asks a client from another ingest instance to resync even when its sequence is in range', async () => {
    const fleet = await waitFor(async () => {
      const snapshot = await getFleet();
      return snapshot.sequence > 0 ? snapshot : undefined;
    });
    const sameInstance = openLive(`${ingest.wsUrl}/live`, 0, fleet.instanceId);
    const otherInstance = openLive(`${ingest.wsUrl}/live`, 0, 'a-previous-run');
    expect(await waitFor(() => otherInstance.messages[0])).toEqual({ type: 'resync' });
    expect(await waitFor(() => sameInstance.messages[0])).toMatchObject({ type: 'patch' });
    sameInstance.socket.close();
    otherInstance.socket.close();
  });

  it('sends heartbeats so clients can tell a quiet connection from a dead one', async () => {
    const live = openLive(`${ingest.wsUrl}/live`, null);
    await waitFor(() => live.messages.find((message) => message.type === 'heartbeat'));
    live.socket.close();
  });

  it('asks a client that is ahead of the server to resync', async () => {
    const live = openLive(`${ingest.wsUrl}/live`, 9999);
    const message = await waitFor(() => live.messages[0]);
    expect(message).toEqual({ type: 'resync' });
    live.socket.close();
  });

  it('serves a robot detail and 404 for an unknown robot', async () => {
    await waitFor(async () => ((await getFleet()).robots.length === 1 ? true : undefined));
    const detail = robotDetailDtoSchema.parse(
      await (await fetch(`${ingest.httpUrl}/api/robots/CLN-0142`)).json(),
    );
    expect(detail.rawMessage.protocol).toBe('vda5050');
    const missing = await fetch(`${ingest.httpUrl}/api/robots/UNKNOWN`);
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: 'not-found' });
  });

  it('accepts known commands and rejects invalid ones', async () => {
    await waitFor(async () => ((await getFleet()).robots.length === 1 ? true : undefined));
    const post = (body: unknown) =>
      fetch(`${ingest.httpUrl}/api/robots/CLN-0142/commands`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    expect((await post({ type: 'send-to-dock' })).status).toBe(202);
    expect((await post({ type: 'self-destruct' })).status).toBe(400);
  });
});
