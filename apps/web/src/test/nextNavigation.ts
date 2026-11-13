import { useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();
const notify = () => {
  for (const listener of listeners) listener();
};

// Next.js keeps useSearchParams in sync with native history.replaceState calls; the mock does the same.
const nativeReplaceState = window.history.replaceState.bind(window.history);
window.history.replaceState = (data: unknown, unused: string, url?: string | URL | null) => {
  nativeReplaceState(data, unused, url);
  notify();
};

let cached = { search: '', params: new URLSearchParams() };
const currentSearchParams = () => {
  if (cached.search !== window.location.search) {
    cached = { search: window.location.search, params: new URLSearchParams(window.location.search) };
  }
  return cached.params;
};

export const navigation = {
  replace: vi.fn((url: string) => {
    nativeReplaceState(null, '', url);
    notify();
  }),
  push: vi.fn(),
  visit(url: string) {
    nativeReplaceState(null, '', url);
    notify();
  },
  reset() {
    nativeReplaceState(null, '', '/');
    navigation.replace.mockClear();
    navigation.push.mockClear();
  },
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const nextNavigationMock = () => ({
  usePathname: () => window.location.pathname,
  useSearchParams: () => useSyncExternalStore(subscribe, currentSearchParams),
  useRouter: () => ({ replace: navigation.replace, push: navigation.push }),
});
