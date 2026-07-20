import { describe, it, expect, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithProviders, resetStores, seedAuth } from '../../test/utils';
import { useAdminGameSearch } from './useAdminCatalog';

const requestedUrls: string[] = [];

describe('useAdminGameSearch', () => {
  beforeEach(() => {
    resetStores();
    seedAuth();
    requestedUrls.length = 0;
  });

  it('searches the global admin catalog, not the personal library', async () => {
    const { server } = await import('../../test/server');
    server.events.on('request:start', ({ request }) => {
      requestedUrls.push(new URL(request.url).pathname);
    });

    const { result } = renderHookWithProviders(() => useAdminGameSearch('hades', 999));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(requestedUrls).toContain('/api/v1/admin/games');
    expect(requestedUrls).not.toContain('/api/v1/games');
  });
});
