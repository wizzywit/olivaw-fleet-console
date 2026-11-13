// Native replaceState updates the URL and Next's useSearchParams without a router navigation. The state argument stays
// null: Next skips its sync when it sees its own history state.
export function replaceSearchParams(ownedKeys: readonly string[], params: URLSearchParams): void {
  const next = new URLSearchParams(window.location.search);
  for (const key of ownedKeys) next.delete(key);
  for (const [key, value] of params) next.set(key, value);
  const query = next.toString();
  const { pathname } = window.location;
  window.history.replaceState(null, '', query === '' ? pathname : `${pathname}?${query}`);
}
