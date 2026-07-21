import { describe, it, expect, beforeEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { createTestQueryClient, renderHookWithProviders, resetStores, seedAuth } from '../../test/utils';
import { server } from '../../test/server';
import { qk } from '../lib/queryKeys';
import { useToastStore } from '../store/toastStore';
import { useAddAlias, useAdminGameSearch, useAdminMergeGame, useLinkIgdb } from './useAdminCatalog';

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

describe('useAdminMergeGame cache invalidation', () => {
  beforeEach(() => {
    resetStores();
    seedAuth();
  });

  it('invalidates the shared games and stats caches after a merge', async () => {
    server.use(
      http.post('/api/v1/admin/games/:id/merge/:targetId', () => new HttpResponse(null, { status: 204 })),
    );

    const client: QueryClient = createTestQueryClient();
    const invalidated: unknown[] = [];
    const original = client.invalidateQueries.bind(client);
    client.invalidateQueries = (filters?: Parameters<typeof original>[0]) => {
      invalidated.push(filters?.queryKey);
      return original(filters);
    };

    const { result } = renderHookWithProviders(() => useAdminMergeGame(45, vi.fn()), client);

    result.current.mutate(99);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Asserted as the keys actually handed to invalidateQueries. A prefix that
    // stopped lining up with what qk.games/qk.stats build would silently stop
    // invalidating rather than fail to compile.
    expect(invalidated).toContainEqual(qk.gamesPrefix);
    expect(invalidated).toContainEqual(qk.statsPrefix);
  });

  it('uses prefixes that actually match the keys the builders produce', () => {
    // invalidateQueries is prefix-matching, so these must stay structurally
    // aligned or invalidation quietly becomes a no-op.
    expect(qk.games({ source: 'picker' }).slice(0, qk.gamesPrefix.length)).toEqual([
      ...qk.gamesPrefix,
    ]);
    expect(qk.stats('summary', { days: 30 }).slice(0, qk.statsPrefix.length)).toEqual([
      ...qk.statsPrefix,
    ]);
    expect(qk.adminGames({}).slice(0, qk.adminGamesPrefix.length)).toEqual([
      ...qk.adminGamesPrefix,
    ]);
    expect(qk.adminReports({}).slice(0, qk.adminReportsPrefix.length)).toEqual([
      ...qk.adminReportsPrefix,
    ]);
  });
});

describe('useLinkIgdb conflict handling', () => {
  beforeEach(() => {
    resetStores();
    seedAuth();
  });

  it('pushes an error toast with an action link to the conflicting game on 409', async () => {
    const { result } = renderHookWithProviders(() => useLinkIgdb(45));

    result.current.mutate(99999);

    await waitFor(() => expect(result.current.isError).toBe(true));

    const toast = useToastStore.getState().toasts[0];
    expect(toast).toBeDefined();
    expect(toast.type).toBe('error');
    expect(toast.action).toEqual({ label: 'Pokaż grę', to: '/admin/catalog?game=33' });
  });
});

describe('useAddAlias conflict handling', () => {
  beforeEach(() => {
    resetStores();
    seedAuth();
  });

  it('pushes an error toast with an action link to the conflicting game on 409', async () => {
    const { result } = renderHookWithProviders(() => useAddAlias(45));

    result.current.mutate('taken.exe');

    await waitFor(() => expect(result.current.isError).toBe(true));

    const toast = useToastStore.getState().toasts[0];
    expect(toast).toBeDefined();
    expect(toast.type).toBe('error');
    expect(toast.action).toEqual({ label: 'Pokaż grę', to: '/admin/catalog?game=33' });
  });

  it('falls back to a generic toast with no action when detail is null', async () => {
    server.use(
      http.post('/api/v1/admin/games/:id/aliases', () =>
        HttpResponse.json({ detail: null }, { status: 409 }),
      ),
    );

    const { result } = renderHookWithProviders(() => useAddAlias(45));

    result.current.mutate('whatever.exe');

    await waitFor(() => expect(result.current.isError).toBe(true));

    const toast = useToastStore.getState().toasts[0];
    expect(toast).toBeDefined();
    expect(toast.action).toBeUndefined();
    expect(toast.message).toBe('Nie udało się dodać aliasu.');
  });

  it('falls back to a generic toast with no action when detail is not an object', async () => {
    server.use(
      http.post('/api/v1/admin/games/:id/aliases', () =>
        HttpResponse.json({ detail: 'alias already exists somewhere' }, { status: 409 }),
      ),
    );

    const { result } = renderHookWithProviders(() => useAddAlias(45));

    result.current.mutate('whatever.exe');

    await waitFor(() => expect(result.current.isError).toBe(true));

    const toast = useToastStore.getState().toasts[0];
    expect(toast).toBeDefined();
    expect(toast.action).toBeUndefined();
    expect(toast.message).toBe('Nie udało się dodać aliasu.');
  });

  it('falls back to a generic toast with no action when conflicting_game_id is not a number', async () => {
    server.use(
      http.post('/api/v1/admin/games/:id/aliases', () =>
        HttpResponse.json({ detail: { conflicting_game_id: 'not-a-game' } }, { status: 409 }),
      ),
    );

    const { result } = renderHookWithProviders(() => useAddAlias(45));

    result.current.mutate('whatever.exe');

    await waitFor(() => expect(result.current.isError).toBe(true));

    const toast = useToastStore.getState().toasts[0];
    expect(toast).toBeDefined();
    expect(toast.action).toBeUndefined();
    expect(toast.message).toBe('Nie udało się dodać aliasu.');
  });
});
