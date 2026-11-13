import {
  robotPatchDtoSchema,
  type AttentionReason,
  type ConnectionState,
  type FleetAggregatesDto,
  type RobotDetailDto,
  type RobotPatchDto,
  type RobotPosition,
  type RobotSummaryDto,
} from '@olivaw/contracts';
import { siteIdForMap, zoneAt } from '@olivaw/demo-world';
import { computeAggregates } from '../robot/aggregates';
import { deriveAttentionReasons, isInAttentionGroup } from '../robot/attention';
import { createAcknowledgements } from '../robot/acknowledgements';
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
    speedMps: toFixedStep(record.speedMps, 0.1, 1),
    operatingMode: record.operatingMode,
    taskId: record.taskId,
    lastReportAt: record.receivedAt.toISOString(),
    connection: record.connection,
  };
}

const toPosition = (record: RobotRecord): RobotPosition => ({
  x: toFixedStep(record.x, 0.1, 1),
  y: toFixedStep(record.y, 0.1, 1),
  headingRad: toFixedStep(record.headingRad, 0.01, 2),
  mapId: record.mapId,
});

const derivedState = (record: RobotRecord) =>
  `${record.status}|${record.attentionReasons.join(',')}|${String(record.attentionSince?.getTime())}`;

function diffSummary(previous: RobotSummaryDto | undefined, next: RobotSummaryDto): RobotPatchDto | null {
  if (previous === undefined) return next;
  const before: Readonly<Record<string, unknown>> = previous;
  const differs = ([key, value]: [string, unknown]) => JSON.stringify(before[key]) !== JSON.stringify(value);
  // Every report moves lastReportAt, so on its own it would put the whole fleet in every patch. It rides along with
  // real changes instead, including going offline, where it marks the robot's last report.
  if (!Object.entries(next).some((entry) => entry[0] !== 'lastReportAt' && differs(entry))) return null;
  const changed = Object.entries(next).filter(differs);
  return robotPatchDtoSchema.parse({ ...Object.fromEntries(changed), id: next.id });
}

export function createRobotStore(config: DomainConfig, { log }: RobotStoreDeps) {
  const records = new Map<string, { record: RobotRecord; siteId: string }>();
  const lastSent = new Map<string, RobotSummaryDto>();
  const touched = new Set<string>();
  const acknowledgements = createAcknowledgements();
  let aggregatesChanged = false;

  // Returns whether the derived state moved, so the sweep only queues robots whose status actually changed.
  function recompute(record: RobotRecord, now: Date): boolean {
    const before = derivedState(record);
    record.attentionReasons = deriveAttentionReasons(record, now, config);
    record.status = deriveStatus(record, now, config);
    record.attentionSince = record.status === 'attention' ? (record.attentionSince ?? now) : null;
    return before !== derivedState(record);
  }

  function aggregates(): FleetAggregatesDto {
    return computeAggregates(
      acknowledgements,
      [...records.values()].map(({ record }) => record),
    );
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
      touched.add(record.robotId);
    },

    applyConnection(robotId: string, state: ConnectionState, now: Date): void {
      const entry = records.get(robotId);
      if (entry === undefined) return;
      entry.record.connection = state;
      recompute(entry.record, now);
      touched.add(robotId);
    },

    sweep(now: Date): void {
      for (const { record } of records.values()) {
        if (recompute(record, now)) touched.add(record.robotId);
      }
    },

    // Acknowledges only robots that are members now, so a robot that joined after the operator looked stays unacknowledged.
    acknowledge(reason: AttentionReason, robotIds: readonly string[]): void {
      const members = robotIds.filter((robotId) => {
        const record = records.get(robotId)?.record;
        return record !== undefined && isInAttentionGroup(record, reason);
      });
      if (acknowledgements.acknowledge(reason, members)) aggregatesChanged = true;
    },

    drainChanges(): { changed: RobotPatchDto[]; removed: string[]; aggregatesChanged: boolean } {
      const changed: RobotPatchDto[] = [];
      for (const robotId of touched) {
        const entry = records.get(robotId);
        if (entry === undefined) continue;
        const summary = toSummary(entry.record, entry.siteId);
        const patch = diffSummary(lastSent.get(robotId), summary);
        if (patch === null) continue;
        changed.push(patch);
        lastSent.set(robotId, summary);
      }
      touched.clear();
      const drained = { changed, removed: [], aggregatesChanged };
      aggregatesChanged = false;
      return drained;
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
        position: toPosition(record),
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
