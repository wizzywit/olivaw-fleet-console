export const isNewerPatch = (sequence: number, latestKnown: number): boolean => sequence > latestKnown;

export const patchesAfter = <T extends { sequence: number }>(patches: readonly T[], sequence: number): T[] =>
  patches.filter((patch) => patch.sequence > sequence);
