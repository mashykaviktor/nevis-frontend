import { useQuery } from '@tanstack/react-query';
import { fetchCompanyData } from '../api/client';

/**
 * Fetches the company client-book tree. `retry: false` plus the exposed
 * `refetch` (aliased as `retry`) matches the old hook's exact behaviour: one
 * attempt on mount, no silent background retry, and an explicit user-triggered
 * retry from the error state's retry button.
 */
export function useCompanyData() {
  const query = useQuery({
    queryKey: ['company'],
    queryFn: ({ signal }) => fetchCompanyData(signal),
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  if (query.isPending || query.isFetching) {
    return { status: 'loading' as const };
  }

  if (query.isSuccess) {
    return { status: 'success' as const, data: query.data };
  }

  return { status: 'error' as const, error: query.error ?? new Error('Unknown error'), retry: query.refetch };
}
