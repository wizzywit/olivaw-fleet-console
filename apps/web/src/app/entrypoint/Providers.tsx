'use client';

import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
  type DehydratedState,
} from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useFleetLiveSync } from '@/entities/fleet';
import { ThemeContext, useThemeController } from '@/features/toggle-theme';

function FleetLiveSync() {
  useFleetLiveSync();
  return null;
}

export interface ProvidersProps {
  children: ReactNode;
  dehydratedState?: DehydratedState;
  queryClient?: QueryClient;
}

export function Providers({ children, dehydratedState, queryClient: providedClient }: ProvidersProps) {
  const [queryClient] = useState(() => providedClient ?? new QueryClient());
  const theme = useThemeController();
  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        <ThemeContext.Provider value={theme}>
          <FleetLiveSync />
          {children}
        </ThemeContext.Provider>
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
