import type { Robot } from '@/entities/robot/@x/fleet';

// How fleet state changes when patches arrive: in order, last value wins, removed robots leave.
// Merging one robot depends on the wire format, so the caller passes it in.
export function applyFleetPatches<P extends { id: string }>(
  robots: ReadonlyMap<string, Robot>,
  patches: readonly { robots: readonly P[]; removed: readonly string[] }[],
  mergeRobot: (robot: Robot | undefined, patch: P) => Robot | null,
): Map<string, Robot> {
  const next = new Map(robots);
  for (const patch of patches) {
    for (const robotPatch of patch.robots) {
      const merged = mergeRobot(next.get(robotPatch.id), robotPatch);
      if (merged !== null) next.set(merged.id, merged);
    }
    for (const id of patch.removed) next.delete(id);
  }
  return next;
}
