const baseDelayMs = 500;
const maxDelayMs = 15_000;

export function backoffDelay(attempt: number, random: () => number = Math.random): number {
  const delay = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
  return delay * (0.8 + 0.4 * random());
}
