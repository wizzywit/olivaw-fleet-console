import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { aSnapshotDto } from '@/test/fleetFixtures';
import { useFleetRepository } from './useFleet';

describe('useFleetRepository', () => {
  it('reports loading until the live store is seeded, even when the snapshot is already cached', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['fleet', 'snapshot'], aSnapshotDto());
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useFleetRepository(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });
});
