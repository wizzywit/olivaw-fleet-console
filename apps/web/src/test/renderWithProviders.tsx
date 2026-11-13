import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { FleetLiveConnection } from '@/entities/fleet';
import { ThemeProvider } from '@/features/toggle-theme';

export function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <FleetLiveConnection />
        {ui}
      </ThemeProvider>
    </QueryClientProvider>,
  );
}
