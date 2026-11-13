import type { StatusCounts } from '@olivaw/contracts';

export const totalOf = (counts: StatusCounts): number =>
  Object.values(counts).reduce((sum, count) => sum + count, 0);
