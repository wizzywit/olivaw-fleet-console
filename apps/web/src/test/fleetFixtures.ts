import type { FleetSnapshotDto, LivePatch, RobotSummaryDto } from '@olivaw/contracts';

const counts = { working: 1, charging: 0, idle: 0, attention: 1, offline: 0 };

export function aRobotDto(overrides: Partial<RobotSummaryDto> = {}): RobotSummaryDto {
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
    batteryPercent: 78,
    charging: false,
    speedMps: 0.6,
    operatingMode: 'AUTOMATIC',
    taskId: 'ord-1a2b',
    lastReportAt: '2026-11-13T10:00:00.000Z',
    connection: 'online',
    ...overrides,
  };
}

export const attentionRobotDto = aRobotDto({
  id: 'DLV-0087',
  displayName: 'DLV-0087',
  vendor: 'Kairo',
  model: 'Courier K1',
  siteId: 'hotel-isar',
  zone: 'Corridor',
  status: 'attention',
  attentionReasons: ['battery-critical'],
  attentionSince: '2026-11-13T09:58:00.000Z',
  batteryPercent: 12,
  taskId: 'ord-55a1',
});

export function aSnapshotDto(overrides: Partial<FleetSnapshotDto> = {}): FleetSnapshotDto {
  return {
    instanceId: 'ingest-run-1',
    sequence: 10,
    generatedAt: '2026-11-13T10:00:00.000Z',
    config: { staleAfterMs: 3000, criticalBatteryPercent: 15, stuckAfterMs: 120_000, patchIntervalMs: 500 },
    sites: [
      { id: 'airport-t2', name: 'Airport T2', maps: [] },
      { id: 'hotel-isar', name: 'Hotel Isar', maps: [] },
    ],
    robots: [aRobotDto(), attentionRobotDto],
    aggregates: {
      byStatus: counts,
      bySite: { 'airport-t2': { ...counts, attention: 0 }, 'hotel-isar': { ...counts, working: 0 } },
      attentionGroups: [
        {
          reason: 'battery-critical',
          priority: 'high',
          count: 1,
          unacknowledgedCount: 1,
          worstRobotId: 'DLV-0087',
          robotIds: ['DLV-0087'],
        },
      ],
    },
    ...overrides,
  };
}

export function aPatch(
  sequence: number,
  robots: LivePatch['robots'],
  overrides: Partial<LivePatch> = {},
): LivePatch {
  return {
    type: 'patch',
    sequence,
    robots,
    removed: [],
    aggregates: aSnapshotDto().aggregates,
    ...overrides,
  };
}
