import { describe, expect, it } from 'vitest';
import attention from './fixtures/state.attention.json';
import working from './fixtures/state.working.json';
import { vda5050StateSchema } from './state';

describe('vda5050StateSchema', () => {
  it('parses a 3.0 working state', () => {
    const state = vda5050StateSchema.parse(working);
    expect(state.powerSupply.stateOfCharge).toBe(78);
    expect(state.mobileRobotPosition?.mapId).toBe('t2-l0');
    expect(state.operatingMode).toBe('AUTOMATIC');
  });

  it('keeps error levels from a state that needs attention', () => {
    const state = vda5050StateSchema.parse(attention);
    expect(state.errors[0]?.errorLevel).toBe('URGENT');
    expect(state.errors[0]?.errorType).toBe('BATTERY_LOW');
  });

  it('rejects stateOfCharge above 100', () => {
    const invalid = { ...working, powerSupply: { stateOfCharge: 140, charging: false } };
    expect(vda5050StateSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects a 2.x message that reports batteryState instead of powerSupply', () => {
    const { powerSupply, ...rest } = working;
    const legacy = { ...rest, batteryState: { batteryCharge: 78, charging: false } };
    expect(vda5050StateSchema.safeParse(legacy).success).toBe(false);
  });

  it('rejects an unknown operating mode', () => {
    expect(vda5050StateSchema.safeParse({ ...working, operatingMode: 'DANCING' }).success).toBe(false);
  });
});
