import broken from '@olivaw/protocols/fixtures/connection.broken.json';
import factsheet from '@olivaw/protocols/fixtures/factsheet.json';
import attention from '@olivaw/protocols/fixtures/state.attention.json';
import working from '@olivaw/protocols/fixtures/state.working.json';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { t } from '../../test/builders';
import { createVda5050Adapter } from './vda5050Adapter';

const bytes = (value: unknown) => Buffer.from(JSON.stringify(value));
const stateTopic = (manufacturer: string, serial: string) => `vda5050/v3/${manufacturer}/${serial}/state`;

describe('vda5050 adapter', () => {
  const log = vi.fn();
  let adapter: ReturnType<typeof createVda5050Adapter>;

  beforeEach(() => {
    log.mockReset();
    adapter = createVda5050Adapter({ log, now: () => t(0) });
  });

  it('maps a state message to a vendor-neutral observation', () => {
    const event = adapter.onMessage(stateTopic('Nordbot', 'CLN-0142'), bytes(working));
    expect(event).toMatchObject({
      kind: 'observation',
      observation: {
        robotId: 'CLN-0142',
        vendor: 'Nordbot',
        model: 'Unknown model',
        protocol: 'vda5050',
        mapId: 't2-l0',
        x: 120.4,
        y: 38.2,
        headingRad: 1.57,
        speedMps: 0.6,
        batteryPercent: 78,
        charging: false,
        operatingMode: 'AUTOMATIC',
        driving: true,
        taskId: 'ord-1a2b',
        errors: [],
        emergencyStop: false,
        receivedAt: t(0),
      },
    });
  });

  it('lowercases error levels and keeps the description', () => {
    const event = adapter.onMessage(stateTopic('Kairo', 'DLV-0087'), bytes(attention));
    expect(event?.kind === 'observation' && event.observation.errors).toEqual([
      { level: 'urgent', code: 'BATTERY_LOW', description: 'Charge below the configured threshold' },
    ]);
  });

  it('treats an empty orderId as no task and an active emergency stop as true', () => {
    const state = {
      ...working,
      orderId: '',
      safetyState: { activeEmergencyStop: 'REMOTE', fieldViolation: false },
    };
    const event = adapter.onMessage(stateTopic('Nordbot', 'CLN-0142'), bytes(state));
    expect(event?.kind === 'observation' && event.observation.taskId).toBeNull();
    expect(event?.kind === 'observation' && event.observation.emergencyStop).toBe(true);
  });

  it('uses the model from an earlier factsheet', () => {
    expect(adapter.onMessage('vda5050/v3/Nordbot/CLN-0142/factsheet', bytes(factsheet))).toEqual({
      kind: 'factsheet',
      robotId: 'CLN-0142',
      model: 'Scrubber S2',
    });
    const event = adapter.onMessage(stateTopic('Nordbot', 'CLN-0142'), bytes(working));
    expect(event?.kind === 'observation' && event.observation.model).toBe('Scrubber S2');
  });

  it('maps connection states', () => {
    expect(adapter.onMessage('vda5050/v3/Kairo/DLV-0087/connection', bytes(broken))).toEqual({
      kind: 'connection',
      robotId: 'DLV-0087',
      state: 'broken',
      at: t(0),
    });
    const hibernating = { ...broken, connectionState: 'HIBERNATING' };
    const event = adapter.onMessage('vda5050/v3/Kairo/DLV-0087/connection', bytes(hibernating));
    expect(event?.kind === 'connection' && event.state).toBe('offline');
  });

  it('keeps the last known position when a state omits it', () => {
    adapter.onMessage(stateTopic('Nordbot', 'CLN-0142'), bytes(working));
    const { mobileRobotPosition, ...withoutPosition } = working;
    const event = adapter.onMessage(stateTopic('Nordbot', 'CLN-0142'), bytes(withoutPosition));
    expect(event?.kind === 'observation' && event.observation.mapId).toBe(mobileRobotPosition.mapId);
  });

  it('drops a first state without a position and logs it', () => {
    const { mobileRobotPosition, ...withoutPosition } = working;
    expect(adapter.onMessage(stateTopic('Nordbot', 'CLN-0142'), bytes(withoutPosition))).toBeNull();
    expect(log).toHaveBeenCalledTimes(1);
  });

  it('drops invalid JSON and logs it', () => {
    expect(adapter.onMessage(stateTopic('Nordbot', 'CLN-0142'), Buffer.from('{not json'))).toBeNull();
    expect(log).toHaveBeenCalledTimes(1);
  });

  it('drops an out-of-range battery value and logs it', () => {
    const invalid = { ...working, powerSupply: { stateOfCharge: 140, charging: false } };
    expect(adapter.onMessage(stateTopic('Nordbot', 'CLN-0142'), bytes(invalid))).toBeNull();
    expect(log).toHaveBeenCalledTimes(1);
  });

  it('drops a message whose serial number does not match its topic', () => {
    expect(adapter.onMessage(stateTopic('Nordbot', 'CLN-9999'), bytes(working))).toBeNull();
    expect(log).toHaveBeenCalledTimes(1);
  });

  it('ignores topics it does not consume without logging', () => {
    expect(adapter.onMessage('vda5050/v3/Nordbot/CLN-0142/order', bytes({}))).toBeNull();
    expect(adapter.onMessage('vda5050/v3/Nordbot/CLN-0142/visualization', bytes({}))).toBeNull();
    expect(log).not.toHaveBeenCalled();
  });
});
