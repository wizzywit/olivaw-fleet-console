import { useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();

export const navigation = {
  pathname: '/',
  search: new URLSearchParams(),
  replace: vi.fn((url: string) => {
    const [, query = ''] = url.split('?');
    navigation.search = new URLSearchParams(query);
    for (const listener of listeners) listener();
  }),
  push: vi.fn(),
  reset() {
    navigation.pathname = '/';
    navigation.search = new URLSearchParams();
    navigation.replace.mockClear();
    navigation.push.mockClear();
  },
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const nextNavigationMock = () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => useSyncExternalStore(subscribe, () => navigation.search),
  useRouter: () => ({ replace: navigation.replace, push: navigation.push }),
});
