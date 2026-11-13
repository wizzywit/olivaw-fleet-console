import { vda5050ConnectionSchema, vda5050FactsheetSchema, vda5050StateSchema } from '@olivaw/protocols';
import { describe, expect, it } from 'vitest';
import { createFleet } from './fleet';
import { stepRobot, type SimRobot } from './robotModel';
import { toVda5050Connection, toVda5050Factsheet, toVda5050State } from './vdaMessages';

const now = new Date('2026-11-13T10:00:00.000Z');

const modes: SimRobot['mode'][] = [
  'working',
  'returning',
  'charging',
  'idle',
  'stuck',
  'faulted',
  'estopped',
];

describe('vda 5050 messages from simulated robots', () => {
  it('produces a valid 3.0 state for every robot and mode', () => {
    for (const robot of createFleet(40, 9)) {
      for (const mode of modes) {
        const state = toVda5050State({ ...robot, mode }, 1, now);
        expect(vda5050StateSchema.safeParse(state).success).toBe(true);
      }
    }
  });

  it('reports an active emergency stop and urgent errors', () => {
    const [robot] = createFleet(1, 1);
    if (robot === undefined) throw new Error('fleet is empty');
    const estopped = toVda5050State({ ...robot, mode: 'estopped' }, 1, now);
    expect(estopped.safetyState.activeEmergencyStop).toBe('REMOTE');
    const faulted = stepRobot({ ...robot, mode: 'working' }, 1000, () => 0, 0);
    const state = toVda5050State(faulted, 2, now);
    expect(vda5050StateSchema.safeParse(state).success).toBe(true);
  });

  it('produces valid connection and factsheet messages', () => {
    const [robot] = createFleet(1, 1);
    if (robot === undefined) throw new Error('fleet is empty');
    expect(vda5050ConnectionSchema.safeParse(toVda5050Connection(robot, 'ONLINE', 1, now)).success).toBe(
      true,
    );
    expect(vda5050FactsheetSchema.parse(toVda5050Factsheet(robot, 1, now)).typeSpecification.seriesName).toBe(
      robot.seriesName,
    );
  });
});
