import type { Robot } from '@/entities/robot';

export function aRobot(overrides: Partial<Robot> = {}): Robot {
  return {
    id: 'CLN-0142',
    displayName: 'CLN-0142',
    vendor: 'Nordbot',
    model: 'Scrubber S2',
    protocol: 'vda5050',
    siteId: 'airport-t2',
    zone: 'Gates C',
    status: 'working',
    attentionReasons: [],
    attentionSince: null,
    battery: { percent: 78, charging: false },
    position: { x: 120.4, y: 38.2, headingRad: 1.57, mapId: 't2-l0' },
    speedMps: 0.6,
    operatingMode: 'AUTOMATIC',
    taskId: 'ord-1a2b',
    lastReportAt: new Date('2026-11-13T10:00:00.000Z'),
    connection: 'online',
    ...overrides,
  };
}
