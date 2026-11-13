'use client';

import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
  type DehydratedState,
} from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useFleetLiveSync } from '@/entities/fleet';
import { ThemeContext, useThemeController, type Theme } from '@/features/toggle-theme';

function FleetLiveSync() {
  useFleetLiveSync();
  return null;
}

export interface ProvidersProps {
  children: ReactNode;
  dehydratedState?: DehydratedState;
  theme?: Theme | null;
  queryClient?: QueryClient;
}

export function Providers({
  children,
  dehydratedState,
  theme: serverTheme = null,
  queryClient: providedClient,
}: ProvidersProps) {
  const [queryClient] = useState(() => providedClient ?? new QueryClient());
  const theme = useThemeController(serverTheme);
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
