import type { AttentionReason } from '@olivaw/contracts';

// Seen marks are shared by every console: an operator marks the members of a group they looked at, and a robot
// that joins the group later, or leaves and comes back, counts as unseen again.
export function createSeenMarks() {
  const seen = new Map<AttentionReason, Set<string>>();
  const seenFor = (reason: AttentionReason) => seen.get(reason) ?? new Set<string>();

  return {
    mark(reason: AttentionReason, robotIds: readonly string[]): boolean {
      const current = seenFor(reason);
      const added = robotIds.filter((robotId) => !current.has(robotId));
      if (added.length === 0) return false;
      seen.set(reason, new Set([...current, ...added]));
      return true;
    },
    keepOnly(reason: AttentionReason, memberIds: readonly string[]): void {
      const members = new Set(memberIds);
      seen.set(reason, new Set([...seenFor(reason)].filter((robotId) => members.has(robotId))));
    },
    unseenIn(reason: AttentionReason, memberIds: readonly string[]): number {
      const current = seenFor(reason);
      return memberIds.filter((robotId) => !current.has(robotId)).length;
    },
  };
}

export type SeenMarks = ReturnType<typeof createSeenMarks>;
