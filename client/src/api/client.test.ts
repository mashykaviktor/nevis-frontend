import { afterEach, describe, expect, it, vi } from 'vitest';
import { sampleCompany, sampleMonths } from '../test/fixtures';
import { fetchCompanyData } from './client';

describe('fetchCompanyData', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves with the parsed JSON body on a successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ company: sampleCompany, months: sampleMonths }),
      }),
    );

    await expect(fetchCompanyData()).resolves.toEqual({ company: sampleCompany, months: sampleMonths });
  });

  it('throws an error naming the HTTP status when the response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Simulated server error' }),
      }),
    );

    await expect(fetchCompanyData()).rejects.toThrow('Failed to load client data (HTTP 500)');
  });

  it('propagates a network-level rejection from fetch itself', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(fetchCompanyData()).rejects.toThrow('Failed to fetch');
  });

  it('forwards the given AbortSignal to fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ company: sampleCompany, months: sampleMonths }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    await fetchCompanyData(controller.signal);

    expect(fetchMock).toHaveBeenCalledWith('/api/company', { signal: controller.signal });
  });
});
