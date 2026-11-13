import type { DomainConfig, RobotObservation, RobotRecord } from '../src/robot/types';

export const t = (ms: number): Date => new Date(Date.UTC(2026, 10, 13, 10, 0, 0) + ms);

export const testConfig: DomainConfig = {
  staleAfterMs: 3000,
  criticalBatteryPercent: 15,
  stuckAfterMs: 120_000,
};

export function anObservation(overrides: Partial<RobotObservation> = {}): RobotObservation {
  return {
    robotId: 'DLV-0087',
    vendor: 'Kairo',
    model: 'Courier K1',
    serialNumber: 'DLV-0087',
    protocol: 'vda5050',
    mapId: 'isar-f4',
    x: 41.2,
    y: 8.7,
    headingRad: 1.57,
    speedMps: 0.6,
    batteryPercent: 64,
    charging: false,
    operatingMode: 'AUTOMATIC',
    driving: true,
    taskId: 'ord-55a1',
    errors: [],
    emergencyStop: false,
    receivedAt: t(0),
    raw: {},
    ...overrides,
  };
}

export function aRecord(overrides: Partial<RobotRecord> = {}): RobotRecord {
  return {
    ...anObservation(),
    connection: 'online',
    stoppedWithTaskSince: null,
    attentionSince: null,
    status: 'working',
    attentionReasons: [],
    ...overrides,
  };
}
