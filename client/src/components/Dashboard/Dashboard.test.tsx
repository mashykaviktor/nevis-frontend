import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sampleCompany, sampleMonths } from '../../test/fixtures';
import { Dashboard } from './Dashboard';

function mockFetchOnce() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ company: sampleCompany, months: sampleMonths }),
    }),
  );
}

describe('Dashboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('announces the true number of revealed rows on re-expand, including a descendant that resumed its own expanded state', async () => {
    mockFetchOnce();
    const user = userEvent.setup();
    render(<Dashboard />);

    await waitFor(() => expect(screen.getByText('Branch 1')).toBeInTheDocument());

    // Expand Branch 1 (reveals Anna + James), then Anna (reveals her 2 channels),
    // then collapse Branch 1 (Anna's expanded state is retained, not cleared),
    // then re-expand Branch 1 — this should reveal all 4 descendants at once,
    // not just Branch 1's 2 direct children.
    await user.click(screen.getByRole('button', { name: /expand branch 1/i }));
    await user.click(screen.getByRole('button', { name: /expand anna blackwood/i }));
    await user.click(screen.getByRole('button', { name: /collapse branch 1/i }));
    await user.click(screen.getByRole('button', { name: /expand branch 1/i }));

    expect(screen.getByRole('status')).toHaveTextContent('Branch 1 expanded, 4 rows shown');
  });
});
