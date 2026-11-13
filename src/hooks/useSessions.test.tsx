import { act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach, vi } from 'vitest';
import { server } from '../../test/server';
import { createTestQueryClient, renderHookWithProviders, resetStores } from '../../test/utils';
import { fixtures } from '../../test/fixtures';
import { useCreateSession, usePatchSession, useRecentSessions, useRestoreSession } from './useSessions';
import { useToastStore } from '../store/toastStore';
import { qk } from '../lib/queryKeys';

beforeEach(() => {
  resetStores();
});

test('useCreateSession invalidates dashboard on success', async () => {
  const queryClient = createTestQueryClient();
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

  const { result } = renderHookWithProviders(() => useCreateSession(), queryClient);

  await act(async () => {
    result.current.mutate({
      game_id: 1,
      start_time: '2026-06-15T18:00:00Z',
      end_time: '2026-06-15T20:00:00Z',
    });
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.dashboard });
  expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.sessions() });
});

test('useCreateSession does not toast on 409 conflict', async () => {
  server.use(
    http.post('/api/v1/sessions', () =>
      HttpResponse.json({ detail: fixtures.conflictResponse }, { status: 409 }),
    ),
  );

  const { result } = renderHookWithProviders(() => useCreateSession());

  await act(async () => {
    result.current.mutate({
      game_id: 1,
      start_time: '2026-06-15T18:00:00Z',
      end_time: '2026-06-15T20:00:00Z',
    });
  });

  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(useToastStore.getState().toasts).toHaveLength(0);
});

test('useRecentSessions fetches COMPLETED and ERROR sessions', async () => {
  let capturedUrl = '';
  server.use(
    http.get('/api/v1/sessions', ({ request }) => {
      capturedUrl = request.url;
      const url = new URL(request.url);
      const statuses = url.searchParams.getAll('status');
      if (statuses.includes('COMPLETED') && statuses.includes('ERROR')) {
        return HttpResponse.json(fixtures.recentSessions);
      }
      return HttpResponse.json([]);
    }),
  );

  const { result } = renderHookWithProviders(() => useRecentSessions());

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toHaveLength(2);
  expect(new URL(capturedUrl).searchParams.getAll('status')).toEqual(['COMPLETED', 'ERROR']);
});

test('useRestoreSession invalidates trash and session-related caches on success', async () => {
  const queryClient = createTestQueryClient();
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

  const { result } = renderHookWithProviders(() => useRestoreSession(), queryClient);

  await act(async () => {
    result.current.mutate(10);
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.trash });
  expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.dashboard });
  expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.sessions() });
  expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['stats'] });
  expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.gameSessions(1) });
});

test('invalidates the games lists after creating a session', async () => {
  const queryClient = createTestQueryClient();
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

  const { result } = renderHookWithProviders(() => useCreateSession(), queryClient);

  await act(async () => {
    result.current.mutate({
      game_id: 1,
      start_time: '2026-08-01T10:00:00Z',
      end_time: '2026-08-01T11:00:00Z',
    });
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.gamesPrefix });
});

test('useCreateSession does not toast a mapped duration 422', async () => {
  server.use(http.post('/api/v1/sessions', () =>
    HttpResponse.json({ detail: 'session duration exceeds 48 hours' }, { status: 422 })));
  const { result } = renderHookWithProviders(() => useCreateSession());
  await act(async () => {
    result.current.mutate({
      game_id: 1,
      start_time: '2026-06-15T10:00:00.000Z',
      end_time: '2026-06-15T12:00:00.000Z',
    });
  });
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(useToastStore.getState().toasts).toHaveLength(0);
});

test('useCreateSession still toasts a pydantic list 422', async () => {
  server.use(http.post('/api/v1/sessions', () =>
    HttpResponse.json({
      detail: [{
        type: 'value_error',
        loc: ['body', 'start_time'],
        msg: 'Value error, datetime must include a timezone offset',
      }],
    }, { status: 422 })));
  const { result } = renderHookWithProviders(() => useCreateSession());
  await act(async () => {
    result.current.mutate({
      game_id: 1,
      start_time: '2026-06-15T10:00:00.000Z',
      end_time: '2026-06-15T12:00:00.000Z',
    });
  });
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(useToastStore.getState().toasts[0]?.message).toBe('Nie udało się zapisać sesji.');
});

test('usePatchSession does not toast a mapped duration 422', async () => {
  server.use(http.patch('/api/v1/sessions/7', () =>
    HttpResponse.json({ detail: 'session duration exceeds 48 hours' }, { status: 422 })));
  const { result } = renderHookWithProviders(() => usePatchSession(7, 1));
  await act(async () => {
    result.current.mutate({ end_time: '2026-06-15T12:00:00.000Z' });
  });
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(useToastStore.getState().toasts).toHaveLength(0);
});
