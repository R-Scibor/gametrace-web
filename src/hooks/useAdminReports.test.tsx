import { describe, it, expect, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { createTestQueryClient, renderHookWithProviders, resetStores, seedAuth } from '../../test/utils';
import { qk } from '../lib/queryKeys';
import { useAdminReports, useTriageReport } from './useAdminReports';

describe('useAdminReports', () => {
  beforeEach(() => {
    resetStores();
    seedAuth();
  });

  it('fetches the open inbox by default', async () => {
    const { result } = renderHookWithProviders(() => useAdminReports({ status: 'open' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.items).toHaveLength(3);
    expect(result.current.data?.items[0].message).toMatch(/telefonie/);
  });

  it('invalidates the overview after triage so the tile count stays honest', async () => {
    const client: QueryClient = createTestQueryClient();
    const invalidated: unknown[] = [];
    const original = client.invalidateQueries.bind(client);
    client.invalidateQueries = (filters?: Parameters<typeof original>[0]) => {
      invalidated.push(filters?.queryKey);
      return original(filters);
    };

    const { result } = renderHookWithProviders(() => useTriageReport(), client);

    result.current.mutate({ id: 17, status: 'triaged' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidated).toContainEqual(qk.adminOverview);
  });
});
