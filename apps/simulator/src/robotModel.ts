import { mapById } from '@olivaw/demo-world';
import type { Vda5050Error } from '@olivaw/protocols';
import { between, type Rng } from './rng';

export type SimMode = 'working' | 'returning' | 'charging' | 'idle' | 'stuck' | 'faulted' | 'estopped';

export interface Point {
  x: number;
  y: number;
}

export interface SimRobot {
  serialNumber: string;
  manufacturer: string;
  seriesName: string;
  mapId: string;
  x: number;
  y: number;
  headingRad: number;
  speedMps: number;
  batteryPercent: number;
  charging: boolean;
  mode: SimMode;
  orderId: string | null;
  orderCount: number;
  target: Point | null;
  returnAtPercent: number;
  errors: Vda5050Error[];
  recoverAtMs: number | null;
  dropoutUntilMs: number | null;
  // A dropout models losing a robot that was reporting; one that never reported would be unknown to ingest.
  hasReported: boolean;
}

const cruiseSpeedMps = 0.6;
const drainPercentPerMinute = 0.9;
const chargePercentPerMinute = 2;
const startOrderPerSecond = 1 / 60;
const dropout = { perSecond: 7.5e-4, durationMs: [20_000, 60_000] as const };

const faultErrors: Vda5050Error[] = [
  { errorType: 'DRIVE_FAULT', errorLevel: 'URGENT', errorDescription: 'Drive motor reported an overcurrent' },
  { errorType: 'LIDAR_DIRTY', errorLevel: 'URGENT', errorDescription: 'Front lidar is obstructed' },
  { errorType: 'BRUSH_JAMMED', errorLevel: 'CRITICAL', errorDescription: 'Cleaning brush is jammed' },
];

const incidents: {
  mode: 'faulted' | 'estopped' | 'stuck';
  perSecond: number;
  durationMs: readonly [number, number];
}[] = [
  { mode: 'faulted', perSecond: 1e-4, durationMs: [30_000, 120_000] },
  { mode: 'estopped', perSecond: 5e-5, durationMs: [20_000, 90_000] },
  { mode: 'stuck', perSecond: 4e-5, durationMs: [60_000, 300_000] },
];

export function randomPointOnMap(mapId: string, rng: Rng): Point {
  const map = mapById(mapId);
  if (map === null) return { x: 0, y: 0 };
  return { x: rng() * map.width, y: rng() * map.height };
}

function nearestDock(robot: SimRobot): Point | null {
  const docks = mapById(robot.mapId)?.docks ?? [];
  let best: Point | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const dock of docks) {
    const distance = Math.hypot(dock.x - robot.x, dock.y - robot.y);
    if (distance < bestDistance) {
      best = { x: dock.x, y: dock.y };
      bestDistance = distance;
    }
  }
  return best;
}

function startOrder(robot: SimRobot, rng: Rng): void {
  robot.orderCount += 1;
  robot.orderId = `ord-${robot.serialNumber.toLowerCase()}-${robot.orderCount}`;
  robot.target = randomPointOnMap(robot.mapId, rng);
  robot.mode = 'working';
}

function rollIncident(robot: SimRobot, rng: Rng, dtSeconds: number, nowMs: number): boolean {
  const incident = incidents.find((candidate) => rng() < candidate.perSecond * dtSeconds);
  if (incident === undefined) return false;
  robot.mode = incident.mode;
  robot.speedMps = 0;
  robot.recoverAtMs = nowMs + between(rng, ...incident.durationMs);
  if (incident.mode === 'faulted') {
    const error = faultErrors[Math.floor(rng() * faultErrors.length)];
    robot.errors = error === undefined ? [] : [error];
  }
  return true;
}

function drive(robot: SimRobot, rng: Rng, dtSeconds: number): void {
  robot.batteryPercent = Math.max(0, robot.batteryPercent - (drainPercentPerMinute * dtSeconds) / 60);
  const target = robot.target;
  if (target === null) return;
  const dx = target.x - robot.x;
  const dy = target.y - robot.y;
  const distance = Math.hypot(dx, dy);
  const step = cruiseSpeedMps * dtSeconds;
  if (distance > step) {
    robot.headingRad = Math.atan2(dy, dx);
    robot.x += (dx / distance) * step;
    robot.y += (dy / distance) * step;
    robot.speedMps = cruiseSpeedMps;
    return;
  }
  robot.x = target.x;
  robot.y = target.y;
  if (robot.mode === 'returning') {
    robot.mode = 'charging';
    robot.charging = true;
    robot.speedMps = 0;
    robot.target = null;
  } else {
    startOrder(robot, rng);
  }
}

export function stepRobot(previous: SimRobot, dtMs: number, rng: Rng, nowMs: number): SimRobot {
  const robot: SimRobot = { ...previous, errors: [...previous.errors] };
  const dtSeconds = dtMs / 1000;

  if (robot.dropoutUntilMs !== null && nowMs >= robot.dropoutUntilMs) robot.dropoutUntilMs = null;
  else if (robot.hasReported && robot.dropoutUntilMs === null && rng() < dropout.perSecond * dtSeconds) {
    robot.dropoutUntilMs = nowMs + between(rng, ...dropout.durationMs);
  }
  if (robot.dropoutUntilMs === null) robot.hasReported = true;

  switch (robot.mode) {
    case 'stuck':
    case 'faulted':
    case 'estopped':
      robot.speedMps = 0;
      if (robot.recoverAtMs !== null && nowMs >= robot.recoverAtMs) {
        robot.mode = 'working';
        robot.errors = [];
        robot.recoverAtMs = null;
      }
      break;
    case 'charging':
      robot.batteryPercent = Math.min(100, robot.batteryPercent + (chargePercentPerMinute * dtSeconds) / 60);
      if (robot.batteryPercent >= 100) {
        robot.charging = false;
        robot.mode = 'idle';
      }
      break;
    case 'idle':
      robot.speedMps = 0;
      if (rng() < startOrderPerSecond * dtSeconds) startOrder(robot, rng);
      break;
    case 'working':
      if (rollIncident(robot, rng, dtSeconds, nowMs)) break;
      if (robot.batteryPercent < robot.returnAtPercent) {
        robot.mode = 'returning';
        robot.orderId = null;
        robot.target = nearestDock(robot);
      }
      drive(robot, rng, dtSeconds);
      break;
    case 'returning':
      drive(robot, rng, dtSeconds);
      break;
  }
  return robot;
}
