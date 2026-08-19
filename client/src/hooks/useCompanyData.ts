import { useCallback, useEffect, useState } from 'react';
import type { CompanyResponse } from '@nevis/shared';
import { fetchCompanyData } from '../api/client';

type CompanyDataState =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'success'; data: CompanyResponse };

/**
 * Fetches the company client-book tree on mount, with a `retry()` escape
 * hatch for the error state. Requests are aborted on unmount/retry so a
 * stale response can never overwrite a newer one.
 */
export function useCompanyData() {
  const [state, setState] = useState<CompanyDataState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    // Resets a stale error/success state back to loading the moment `attempt`
    // changes (retry), so the UI doesn't flash old data/error while the new
    // request is in flight.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ status: 'loading' });

    fetchCompanyData(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setState({ status: 'success', data });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: 'error',
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
      });

    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  return { ...state, retry };
}
