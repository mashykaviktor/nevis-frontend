import type { CompanyResponse } from '@nevis/shared';

export async function fetchCompanyData(signal?: AbortSignal): Promise<CompanyResponse> {
  const res = await fetch('/api/company', { signal });

  if (!res.ok) {
    throw new Error(`Failed to load client data (HTTP ${res.status})`);
  }

  return (await res.json()) as CompanyResponse;
}
