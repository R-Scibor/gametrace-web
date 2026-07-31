import { describe, it, expect, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { createTestQueryClient, renderHookWithProviders, resetStores, seedAuth } from '../../test/utils';
import { qk } from '../lib/queryKeys';
import {
  useAdminReports,
  useAdminReportFacets,
  usePatchAdminReport,
  useDeleteAdminReport,
} from './useAdminReports';

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

  it('passes q filter to the list query', async () => {
    const { result } = renderHookWithProviders(() =>
      useAdminReports({ status: 'open', q: 'telefonie' }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items[0].id).toBe(17);
  });
});

describe('useAdminReportFacets', () => {
  beforeEach(() => {
    resetStores();
    seedAuth();
  });

  it('loads screen and platform facets', async () => {
    const { result } = renderHookWithProviders(() => useAdminReportFacets('open'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.screens.some((s) => s.value === 'SessionForm')).toBe(true);
    expect(result.current.data?.platforms.some((p) => p.value === 'android')).toBe(true);
  });
});

describe('usePatchAdminReport', () => {
  beforeEach(() => {
    resetStores();
    seedAuth();
  });

  it('invalidates overview and reports after status patch', async () => {
    const client: QueryClient = createTestQueryClient();
    const invalidated: unknown[] = [];
    const original = client.invalidateQueries.bind(client);
    client.invalidateQueries = (filters?: Parameters<typeof original>[0]) => {
      invalidated.push(filters?.queryKey);
      return original(filters);
    };

    const { result } = renderHookWithProviders(() => usePatchAdminReport(), client);
    result.current.mutate({ id: 17, status: 'open' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidated).toContainEqual(qk.adminOverview);
    expect(invalidated).toContainEqual(qk.adminReportsPrefix);
  });

  it('patches admin_note without requiring status', async () => {
    const { result } = renderHookWithProviders(() => usePatchAdminReport());
    result.current.mutate({ id: 17, admin_note: 'repro on android' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.admin_note).toBe('repro on android');
  });
});

describe('useDeleteAdminReport', () => {
  beforeEach(() => {
    resetStores();
    seedAuth();
  });

  it('invalidates overview and reports after delete', async () => {
    const client: QueryClient = createTestQueryClient();
    const invalidated: unknown[] = [];
    const original = client.invalidateQueries.bind(client);
    client.invalidateQueries = (filters?: Parameters<typeof original>[0]) => {
      invalidated.push(filters?.queryKey);
      return original(filters);
    };

    const { result } = renderHookWithProviders(() => useDeleteAdminReport(), client);
    result.current.mutate(17);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidated).toContainEqual(qk.adminOverview);
    expect(invalidated).toContainEqual(qk.adminReportsPrefix);
  });
});
