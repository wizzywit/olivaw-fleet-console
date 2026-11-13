import { describe, expect, it } from 'vitest';
import { liveClientMessageSchema, liveServerMessageSchema } from './live';

const aggregates = {
  byStatus: { working: 1, charging: 0, idle: 0, attention: 0, offline: 0 },
  bySite: { 'hotel-isar': { working: 1, charging: 0, idle: 0, attention: 0, offline: 0 } },
  attentionGroups: [],
};

describe('live messages', () => {
  it('accepts a patch that carries only changed robot fields', () => {
    const message = liveServerMessageSchema.parse({
      type: 'patch',
      sequence: 7,
      robots: [{ id: 'DLV-0087', batteryPercent: 11 }],
      removed: [],
      aggregates,
    });
    expect(message.type).toBe('patch');
  });

  it('rejects a patch robot without an id', () => {
    const result = liveServerMessageSchema.safeParse({
      type: 'patch',
      sequence: 7,
      robots: [{ batteryPercent: 11 }],
      removed: [],
      aggregates,
    });
    expect(result.success).toBe(false);
  });

  it('rejects aggregates that miss a status', () => {
    const result = liveServerMessageSchema.safeParse({
      type: 'patch',
      sequence: 7,
      robots: [],
      removed: [],
      aggregates: { ...aggregates, byStatus: { working: 1 } },
    });
    expect(result.success).toBe(false);
  });

  it('accepts a resync instruction', () => {
    expect(liveServerMessageSchema.parse({ type: 'heartbeat' })).toEqual({ type: 'heartbeat' });
    expect(liveServerMessageSchema.parse({ type: 'resync' })).toEqual({ type: 'resync' });
  });

  it('accepts a hello with or without a last sequence', () => {
    expect(
      liveClientMessageSchema.parse({ type: 'hello', lastSequence: 3, instanceId: 'a' }).instanceId,
    ).toBe('a');
    expect(liveClientMessageSchema.parse({ type: 'hello', lastSequence: null, instanceId: null }).lastSequence).toBeNull();
    expect(liveClientMessageSchema.parse({ type: 'hello', lastSequence: 12, instanceId: 'x' }).lastSequence).toBe(12);
  });
});
