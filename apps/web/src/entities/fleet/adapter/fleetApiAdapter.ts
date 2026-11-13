import {
  fleetSnapshotDtoSchema,
  robotSummaryDtoSchema,
  type FleetSnapshotDto,
  type LivePatch,
  type RobotPatchDto,
  type RobotSummaryDto,
} from '@olivaw/contracts';
import { httpGet } from '@/shared/api';
import type { Robot } from '@/entities/robot/@x/fleet';
import type { FleetPatch, FleetSnapshot } from '../types/fleet';

export function toRobot(dto: RobotSummaryDto): Robot {
  const { batteryPercent, charging, attentionSince, lastReportAt, ...rest } = dto;
  return {
    ...rest,
    battery: { percent: batteryPercent, charging },
    attentionSince: attentionSince === null ? null : new Date(attentionSince),
    lastReportAt: new Date(lastReportAt),
  };
}

function fromRobot(robot: Robot): RobotSummaryDto {
  const { battery, attentionSince, lastReportAt, ...rest } = robot;
  return {
    ...rest,
    batteryPercent: battery.percent,
    charging: battery.charging,
    attentionSince: attentionSince?.toISOString() ?? null,
    lastReportAt: lastReportAt.toISOString(),
  };
}

// A known robot keeps its last good state if a patch would make it invalid; an unknown one needs every field.
export function applyRobotPatch(robot: Robot | undefined, patch: RobotPatchDto): Robot | null {
  const merged = robotSummaryDtoSchema.safeParse({
    ...(robot === undefined ? {} : fromRobot(robot)),
    ...patch,
  });
  if (merged.success) return toRobot(merged.data);
  return robot ?? null;
}

export function toFleetSnapshot(dto: FleetSnapshotDto): FleetSnapshot {
  return {
    sequence: dto.sequence,
    generatedAt: new Date(dto.generatedAt),
    config: dto.config,
    sites: dto.sites,
    robots: new Map(dto.robots.map((robot) => [robot.id, toRobot(robot)])),
    aggregates: dto.aggregates,
  };
}

export const toFleetPatch = ({ sequence, robots, removed, aggregates }: LivePatch): FleetPatch => ({
  sequence,
  robots,
  removed,
  aggregates,
});

export const fetchFleetSnapshotDto = (signal?: AbortSignal): Promise<FleetSnapshotDto> =>
  httpGet('/api/fleet', fleetSnapshotDtoSchema, signal === undefined ? {} : { signal });
