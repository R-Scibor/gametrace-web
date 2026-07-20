import { describe, it, expect, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderHookWithProviders, resetStores, seedAuth } from '../../test/utils';
import { server } from '../../test/server';
import { useToastStore } from '../store/toastStore';
import { useAddAlias, useAdminGameSearch, useLinkIgdb } from './useAdminCatalog';

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
