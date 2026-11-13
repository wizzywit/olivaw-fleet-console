'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { FleetStoreProvider } from '@/entities/fleet';
import { ThemeProvider } from '@/features/toggle-theme';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <FleetStoreProvider>{children}</FleetStoreProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
