import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '../../test/server';
import { useAdminGames, useRequeueEnrichment } from './useAdmin';
import { useToastStore } from '../store/toastStore';
import { resetStores } from '../../test/utils';

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

beforeEach(() => resetStores());

test('useAdminGames fetches catalog list', async () => {
  server.use(
    http.get('/api/v1/admin/games', () =>
      HttpResponse.json({
        total: 1,
        items: [
          {
            id: 45,
            primary_name: 'Kingdom Hearts',
            enrichment_status: 'NEEDS_REVIEW',
            cover_image_url: null,
            cover_source: 'EXTERNAL',
            external_api_id: null,
            aliases: ['KH.exe'],
            session_count: 26,
          },
        ],
      }),
    ),
  );

  const { result } = renderHook(() => useAdminGames({ status: 'NEEDS_REVIEW' }), {
    wrapper: wrapper(),
  });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.items[0].session_count).toBe(26);
});

test('useRequeueEnrichment shows Polish success toast', async () => {
  server.use(
    http.post('/api/v1/admin/games/45/enrich', () =>
      HttpResponse.json({ queued: true }, { status: 202 }),
    ),
  );

  const { result } = renderHook(() => useRequeueEnrichment(), { wrapper: wrapper() });
  result.current.mutate(45);
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(useToastStore.getState().toasts[0]?.message).toBe('Wzbogacanie dodane do kolejki.');
});