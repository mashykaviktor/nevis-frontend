import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Renders with a fresh QueryClient per call so the cache can't leak state
 * between tests. Mirrors useCompanyData's query config (retry/staleTime/
 * refetchOnWindowFocus) so tests don't diverge from production refetch behaviour.
 */
export function renderWithQuery(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, refetchOnWindowFocus: false },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}
