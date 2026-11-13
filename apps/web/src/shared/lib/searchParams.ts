// Native replaceState updates the URL without a router navigation; Next.js patches replaceState and syncs
// useSearchParams. The state argument stays null, because a state object carrying Next's own internal marker is
// treated as Next's own call and not synced.
export function replaceSearchParams(ownedKeys: readonly string[], params: URLSearchParams): void {
  const next = new URLSearchParams(window.location.search);
  for (const key of ownedKeys) next.delete(key);
  for (const [key, value] of params) next.set(key, value);
  const query = next.toString();
  const { pathname } = window.location;
  window.history.replaceState(null, '', query === '' ? pathname : `${pathname}?${query}`);
}
