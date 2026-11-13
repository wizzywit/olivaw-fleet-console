import { describe, expect, it } from 'vitest';
import { fleetAggregatesDtoSchema, seenMarkRequestSchema } from './fleet';

const counts = { working: 0, charging: 0, idle: 0, attention: 2, offline: 0 };
const aggregatesWith = (group: Record<string, unknown>) => ({
  byStatus: counts,
  bySite: {},
  attentionGroups: [
    { reason: 'stuck', priority: 'medium', count: 2, worstRobotId: 'A', robotIds: ['A', 'B'], ...group },
  ],
});

describe('fleet aggregates', () => {
  it('carries how many members of a group nobody has marked seen', () => {
    expect(
      fleetAggregatesDtoSchema.parse(aggregatesWith({ unseenCount: 1 })).attentionGroups[0]?.unseenCount,
    ).toBe(1);
  });

  it('rejects a group without an unseen count', () => {
    expect(fleetAggregatesDtoSchema.safeParse(aggregatesWith({})).success).toBe(false);
  });

  it('rejects more unseen members than the group has', () => {
    expect(fleetAggregatesDtoSchema.safeParse(aggregatesWith({ unseenCount: 3 })).success).toBe(false);
  });
});

describe('seen mark request', () => {
  it('names the robots the operator saw', () => {
    expect(seenMarkRequestSchema.parse({ robotIds: ['A'] })).toEqual({ robotIds: ['A'] });
    expect(seenMarkRequestSchema.safeParse({ robotIds: 'A' }).success).toBe(false);
  });
});
