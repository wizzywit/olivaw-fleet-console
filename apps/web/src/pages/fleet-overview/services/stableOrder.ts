export interface ReconciledOrder {
  order: string[];
  pendingChanges: number;
}

// While the user is working in the list, rows keep their place: new rows are appended and removed rows dropped,
// and the number of rows that would move is reported so the user can re-sort on purpose.
export function reconcileOrder(
  current: readonly string[],
  next: readonly string[],
  isHeld: boolean,
): ReconciledOrder {
  if (!isHeld) return { order: [...next], pendingChanges: 0 };
  const nextIds = new Set(next);
  const currentIds = new Set(current);
  const order = [...current.filter((id) => nextIds.has(id)), ...next.filter((id) => !currentIds.has(id))];
  const nextIndex = new Map(next.map((id, index) => [id, index]));
  const pendingChanges = order.filter((id, index) => nextIndex.get(id) !== index).length;
  return { order, pendingChanges };
}
