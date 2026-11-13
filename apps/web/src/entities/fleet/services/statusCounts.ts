import type { StatusCounts } from '../types/fleet';

export const totalOf = (counts: StatusCounts): number =>
  Object.values(counts).reduce((sum, count) => sum + count, 0);
