import type { Robot } from '@/entities/robot';

export function countNewInAttention(
  robotIds: readonly string[],
  robots: ReadonlyMap<string, Robot>,
  now: Date,
  windowMs: number,
): number {
  return robotIds.filter((id) => {
    const since = robots.get(id)?.attentionSince;
    return since !== undefined && since !== null && now.getTime() - since.getTime() <= windowMs;
  }).length;
}
