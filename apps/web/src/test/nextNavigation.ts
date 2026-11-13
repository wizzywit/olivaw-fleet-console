export const navigation = {
  pathname: '/',
  search: new URLSearchParams(),
  replace: vi.fn((url: string) => {
    const [, query = ''] = url.split('?');
    navigation.search = new URLSearchParams(query);
  }),
};

export const nextNavigationMock = () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.search,
  useRouter: () => ({ replace: navigation.replace, push: navigation.replace }),
});
