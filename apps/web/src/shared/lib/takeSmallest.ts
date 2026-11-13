// The first n items in sort order without sorting everything: keeps a small sorted buffer, O(items × n).
export function takeSmallest<T>(items: Iterable<T>, n: number, compare: (a: T, b: T) => number): T[] {
  const kept: T[] = [];
  for (const item of items) {
    const last = kept.at(-1);
    if (kept.length >= n && last !== undefined && compare(item, last) >= 0) continue;
    const at = kept.findIndex((candidate) => compare(item, candidate) < 0);
    kept.splice(at === -1 ? kept.length : at, 0, item);
    if (kept.length > n) kept.pop();
  }
  return kept;
}
