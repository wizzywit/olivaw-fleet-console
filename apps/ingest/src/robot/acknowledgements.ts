import type { AttentionReason } from '@olivaw/contracts';

// Acknowledgements are shared by every console: an operator acknowledges the members of a group they looked at, and a
// robot that joins the group later, or leaves and comes back, counts as unacknowledged again (as an alarm does when its
// condition returns).
export function createAcknowledgements() {
  const acknowledged = new Map<AttentionReason, Set<string>>();
  const acknowledgedFor = (reason: AttentionReason) => acknowledged.get(reason) ?? new Set<string>();

  return {
    acknowledge(reason: AttentionReason, robotIds: readonly string[]): boolean {
      const current = acknowledgedFor(reason);
      const added = robotIds.filter((robotId) => !current.has(robotId));
      if (added.length === 0) return false;
      acknowledged.set(reason, new Set([...current, ...added]));
      return true;
    },
    forget(reason: AttentionReason, robotId: string): void {
      acknowledged.get(reason)?.delete(robotId);
    },
    unacknowledgedIn(reason: AttentionReason, memberIds: readonly string[]): number {
      const current = acknowledgedFor(reason);
      return memberIds.filter((robotId) => !current.has(robotId)).length;
    },
  };
}

export type Acknowledgements = ReturnType<typeof createAcknowledgements>;
