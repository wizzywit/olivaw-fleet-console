'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { FleetLiveConnection } from '@/entities/fleet';
import { ThemeProvider } from '@/features/toggle-theme';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <FleetLiveConnection />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
