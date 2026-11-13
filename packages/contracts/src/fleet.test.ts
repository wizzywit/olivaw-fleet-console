import { describe, expect, it } from 'vitest';
import { fleetAggregatesDtoSchema, acknowledgeRequestSchema } from './fleet';

const counts = { working: 0, charging: 0, idle: 0, attention: 2, offline: 0 };
const aggregatesWith = (group: Record<string, unknown>) => ({
  byStatus: counts,
  bySite: {},
  attentionGroups: [
    { reason: 'stuck', priority: 'medium', count: 2, worstRobotId: 'A', robotIds: ['A', 'B'], ...group },
  ],
});

describe('fleet aggregates', () => {
  it('carries how many members of a group nobody has acknowledged', () => {
    expect(
      fleetAggregatesDtoSchema.parse(aggregatesWith({ unacknowledgedCount: 1 })).attentionGroups[0]
        ?.unacknowledgedCount,
    ).toBe(1);
  });

  it('rejects a group without an unacknowledged count', () => {
    expect(fleetAggregatesDtoSchema.safeParse(aggregatesWith({})).success).toBe(false);
  });

  it('rejects more unacknowledged members than the group has', () => {
    expect(fleetAggregatesDtoSchema.safeParse(aggregatesWith({ unacknowledgedCount: 3 })).success).toBe(
      false,
    );
  });
});

describe('acknowledge request', () => {
  it('names the robots the operator saw', () => {
    expect(acknowledgeRequestSchema.parse({ robotIds: ['A'] })).toEqual({ robotIds: ['A'] });
    expect(acknowledgeRequestSchema.safeParse({ robotIds: 'A' }).success).toBe(false);
  });
});
