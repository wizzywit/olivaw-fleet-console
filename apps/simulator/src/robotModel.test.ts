import { describe, expect, it } from 'vitest';
import { createFleet } from './fleet';
import { stepRobot, type SimRobot } from './robotModel';

const noEvents = () => 0.99;
const minute = 60_000;

function aRobot(overrides: Partial<SimRobot> = {}): SimRobot {
  const [robot] = createFleet(1, 42);
  if (robot === undefined) throw new Error('fleet is empty');
  return { ...robot, mode: 'working', batteryPercent: 80, charging: false, ...overrides };
}

function run(robot: SimRobot, totalMs: number, stepMs = 1000): SimRobot {
  let current = robot;
  for (let elapsed = 0; elapsed < totalMs; elapsed += stepMs) {
    current = stepRobot(current, stepMs, noEvents, elapsed);
  }
  return current;
}

describe('stepRobot', () => {
  it('never drops a robot out before it has reported once, so every robot is known to ingest', () => {
    const alwaysDrop = () => 0;
    const first = stepRobot(aRobot(), 1000, alwaysDrop, 0);
    expect(first.dropoutUntilMs).toBeNull();
    const second = stepRobot(first, 1000, alwaysDrop, 1000);
    expect(second.dropoutUntilMs).not.toBeNull();
  });

  it('drains 0.9% per minute while working', () => {
    const after = run(aRobot(), minute);
    expect(after.batteryPercent).toBeCloseTo(79.1, 2);
  });

  it('heads to a dock once below its return threshold', () => {
    const robot = stepRobot(aRobot({ batteryPercent: 19, returnAtPercent: 20 }), 1000, noEvents, 0);
    expect(robot.mode).toBe('returning');
    expect(robot.orderId).toBeNull();
  });

  it('charges at 2% per minute at a dock and becomes idle when full', () => {
    const charging = aRobot({ mode: 'charging', charging: true, batteryPercent: 98, speedMps: 0 });
    const after = run(charging, 1.5 * minute);
    expect(after.batteryPercent).toBe(100);
    expect(after.charging).toBe(false);
    expect(after.mode).toBe('idle');
  });

  it('starts charging on reaching the dock', () => {
    const robot = aRobot({ mode: 'returning', batteryPercent: 18 });
    const atDock = { ...robot, x: robot.target?.x ?? robot.x, y: robot.target?.y ?? robot.y };
    const after = stepRobot({ ...atDock, target: { x: atDock.x, y: atDock.y } }, 1000, noEvents, 0);
    expect(after.mode).toBe('charging');
    expect(after.charging).toBe(true);
    expect(after.speedMps).toBe(0);
  });

  it('enters a fault with an urgent error when the event roll hits', () => {
    const faultRoll = () => 0;
    const robot = stepRobot(aRobot(), 1000, faultRoll, 0);
    expect(robot.mode).not.toBe('working');
    expect(['stuck', 'faulted', 'estopped']).toContain(robot.mode);
  });

  it('never leaves its map while driving', () => {
    const after = run(aRobot(), 10 * minute);
    expect(after.x).toBeGreaterThanOrEqual(0);
    expect(after.y).toBeGreaterThanOrEqual(0);
  });

  it('does not mutate the robot it is given', () => {
    const robot = aRobot();
    const copy = structuredClone(robot);
    stepRobot(robot, 1000, noEvents, 0);
    expect(robot).toEqual(copy);
  });
});
