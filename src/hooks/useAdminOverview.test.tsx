import { describe, it, expect, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithProviders, resetStores, seedAuth } from '../../test/utils';
import { useAdminOverview } from './useAdminOverview';

describe('useAdminOverview', () => {
  beforeEach(() => {
    resetStores();
    seedAuth();
  });

  it('fetches homelab-wide overview totals', async () => {
    const { result } = renderHookWithProviders(() => useAdminOverview());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.user_count).toBe(4);
    expect(result.current.data?.needs_review_count).toBe(12);
    expect(result.current.data?.open_reports_count).toBe(3);
  });
});
