import type {
  ConnectionState,
  FleetAggregatesDto,
  RobotDetailDto,
  RobotPatchDto,
  RobotSummaryDto,
} from '@olivaw/contracts';
import { siteIdForMap, zoneAt } from '@olivaw/demo-world';
import { computeAggregates } from '../robot/aggregates';
import { deriveAttentionReasons } from '../robot/attention';
import { deriveStatus } from '../robot/status';
import type { DomainConfig, RobotObservation, RobotRecord } from '../robot/types';

export interface RobotStoreDeps {
  log: (message: string, data?: Record<string, unknown>) => void;
}

const roundTo = (value: number, step: number) => Math.round(value / step) * step;
const toFixedStep = (value: number, step: number, digits: number) =>
  Number(roundTo(value, step).toFixed(digits));

function toSummary(record: RobotRecord, siteId: string): RobotSummaryDto {
  return {
    id: record.robotId,
    displayName: record.robotId,
    vendor: record.vendor,
    model: record.model,
    protocol: record.protocol,
    siteId,
    zone: zoneAt(record.mapId, record.x, record.y),
    status: record.status,
    attentionReasons: record.attentionReasons,
    attentionSince: record.attentionSince?.toISOString() ?? null,
    // Floored so a robot shown at 15% is never also flagged as below 15%.
    batteryPercent: Math.floor(record.batteryPercent),
    charging: record.charging,
    position: {
      x: toFixedStep(record.x, 0.1, 1),
      y: toFixedStep(record.y, 0.1, 1),
      headingRad: toFixedStep(record.headingRad, 0.01, 2),
      mapId: record.mapId,
    },
    speedMps: toFixedStep(record.speedMps, 0.1, 1),
    operatingMode: record.operatingMode,
    taskId: record.taskId,
    lastReportAt: record.receivedAt.toISOString(),
    connection: record.connection,
  };
}

function diffSummary(previous: RobotSummaryDto | undefined, next: RobotSummaryDto): RobotPatchDto | null {
  if (previous === undefined) return next;
  const changed: RobotPatchDto = { id: next.id };
  let hasChanges = false;
  for (const key of Object.keys(next) as (keyof RobotSummaryDto)[]) {
    if (JSON.stringify(previous[key]) !== JSON.stringify(next[key])) {
      Object.assign(changed, { [key]: next[key] });
      hasChanges = true;
    }
  }
  return hasChanges ? changed : null;
}

export function createRobotStore(config: DomainConfig, { log }: RobotStoreDeps) {
  const records = new Map<string, { record: RobotRecord; siteId: string }>();
  const lastSent = new Map<string, RobotSummaryDto>();
  const touched = new Set<string>();

  function recompute(record: RobotRecord, now: Date): void {
    record.attentionReasons = deriveAttentionReasons(record, now, config);
    record.status = deriveStatus(record, now, config);
    record.attentionSince = record.status === 'attention' ? (record.attentionSince ?? now) : null;
    touched.add(record.robotId);
  }

  function aggregates(): FleetAggregatesDto {
    return computeAggregates([...records.values()].map(({ record }) => record));
  }

  return {
    applyObservation(observation: RobotObservation, now: Date): void {
      const siteId = siteIdForMap(observation.mapId);
      if (siteId === null) {
        log('store: ignored observation on a map that belongs to no site', {
          robotId: observation.robotId,
          mapId: observation.mapId,
        });
        return;
      }
      const previous = records.get(observation.robotId)?.record;
      const stoppedWithTask = observation.taskId !== null && !observation.driving;
      const record: RobotRecord = {
        ...observation,
        connection: 'online',
        stoppedWithTaskSince: stoppedWithTask
          ? (previous?.stoppedWithTaskSince ?? observation.receivedAt)
          : null,
        attentionSince: previous?.attentionSince ?? null,
        status: previous?.status ?? 'idle',
        attentionReasons: [],
      };
      records.set(record.robotId, { record, siteId });
      recompute(record, now);
    },

    applyConnection(robotId: string, state: ConnectionState, now: Date): void {
      const entry = records.get(robotId);
      if (entry === undefined) return;
      entry.record.connection = state;
      recompute(entry.record, now);
    },

    sweep(now: Date): void {
      for (const { record } of records.values()) recompute(record, now);
    },

    drainChanges(): { changed: RobotPatchDto[]; removed: string[] } {
      const changed: RobotPatchDto[] = [];
      for (const robotId of touched) {
        const entry = records.get(robotId);
        if (entry === undefined) continue;
        const summary = toSummary(entry.record, entry.siteId);
        const patch = diffSummary(lastSent.get(robotId), summary);
        if (patch !== null) changed.push(patch);
        lastSent.set(robotId, summary);
      }
      touched.clear();
      return { changed, removed: [] };
    },

    aggregates,

    snapshot(): { robots: RobotSummaryDto[]; aggregates: FleetAggregatesDto } {
      return {
        robots: [...records.values()].map(({ record, siteId }) => toSummary(record, siteId)),
        aggregates: aggregates(),
      };
    },

    detail(robotId: string): RobotDetailDto | undefined {
      const entry = records.get(robotId);
      if (entry === undefined) return undefined;
      const { record, siteId } = entry;
      return {
        ...toSummary(record, siteId),
        serialNumber: record.serialNumber,
        errors: record.errors,
        rawMessage: {
          protocol: record.protocol,
          receivedAt: record.receivedAt.toISOString(),
          payload: record.raw,
        },
      };
    },
  };
}

export type RobotStore = ReturnType<typeof createRobotStore>;
