import type { LivePatch } from '@olivaw/contracts';
import { describe, expect, it } from 'vitest';
import { createPatchLog } from './patchLog';

const patch = (sequence: number): LivePatch => ({
  type: 'patch',
  sequence,
  robots: [],
  removed: [],
  aggregates: {
    byStatus: { working: 0, charging: 0, idle: 0, attention: 0, offline: 0 },
    bySite: {},
    attentionGroups: [],
  },
});

const sequences = (result: LivePatch[] | 'resync') =>
  result === 'resync' ? result : result.map((entry) => entry.sequence);

const appendAll = (log: ReturnType<typeof createPatchLog>, numbers: number[]) => {
  for (const n of numbers) log.append(patch(n));
};

describe('patch log', () => {
  it('starts at sequence 0 and hands out the next sequence', () => {
    const log = createPatchLog(3);
    expect(log.latestSequence()).toBe(0);
    expect(log.nextSequence()).toBe(1);
  });

  it('returns nothing for a client that is up to date', () => {
    const log = createPatchLog(3);
    log.append(patch(1));
    expect(log.since(1)).toEqual([]);
  });

  it('returns the patches a client missed, in order', () => {
    const log = createPatchLog(3);
    appendAll(log, [1, 2, 3]);
    expect(sequences(log.since(1))).toEqual([2, 3]);
  });

  it('asks for a resync when the client is ahead of the server', () => {
    const log = createPatchLog(3);
    log.append(patch(1));
    expect(log.since(6)).toBe('resync');
  });

  it('asks for a resync when the missed patches are no longer kept', () => {
    const log = createPatchLog(3);
    appendAll(log, [1, 2, 3, 4]);
    expect(log.since(0)).toBe('resync');
    expect(sequences(log.since(1))).toEqual([2, 3, 4]);
  });

  it('serves a client exactly one full log behind, and asks one patch further back to resync', () => {
    const log = createPatchLog(120);
    appendAll(
      log,
      Array.from({ length: 200 }, (_, index) => index + 1),
    );
    expect(sequences(log.since(80))).toHaveLength(120);
    expect(log.since(79)).toBe('resync');
  });
});
