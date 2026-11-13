import type { LivePatch } from '@olivaw/contracts';

export function createPatchLog(capacity: number) {
  const patches: LivePatch[] = [];
  let latest = 0;

  return {
    latestSequence: () => latest,
    nextSequence: () => latest + 1,
    append(patch: LivePatch): void {
      patches.push(patch);
      latest = patch.sequence;
      if (patches.length > capacity) patches.shift();
    },
    since(sequence: number): LivePatch[] | 'resync' {
      if (sequence > latest) return 'resync';
      const oldestKept = patches[0]?.sequence ?? latest + 1;
      if (sequence < oldestKept - 1) return 'resync';
      return patches.filter((patch) => patch.sequence > sequence);
    },
  };
}

export type PatchLog = ReturnType<typeof createPatchLog>;
