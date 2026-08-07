import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach } from 'vitest';
import { useAuth } from './useAuth';
import { useAuthStore } from '../store/authStore';
import { saveScheduledDeletion, readScheduledDeletion } from '../lib/accountDeletion';
import { renderHookWithProviders, resetStores } from '../../test/utils';
import { server } from '../../test/server';

beforeEach(() => {
  resetStores();
  sessionStorage.clear();
});

test('useAuth stores token on successful link login', async () => {
  let capturedBody: { code?: string; timezone?: string } = {};
  server.use(
    http.post('/api/v1/auth/link', async ({ request }) => {
      capturedBody = (await request.json()) as { code?: string; timezone?: string };
      return HttpResponse.json({
        token: 'link-token',
        discord_id: '888',
        username: 'linked',
        timezone: 'Europe/Warsaw',
        is_admin: true,
      });
    }),
  );

  const { result } = renderHookWithProviders(() => useAuth());
  const ok = await result.current.handleLinkLogin('231 996');

  expect(ok).toBe(true);
  expect(capturedBody.code).toBe('231996');

  await waitFor(() => {
    expect(useAuthStore.getState().token).toBe('link-token');
    expect(useAuthStore.getState().user?.username).toBe('linked');
    expect(useAuthStore.getState().isAdmin).toBe(true);
  });
});

test('useAuth clears a stale scheduled-deletion flag on a login with no pending deletion', async () => {
  // Repro: schedule deletion, cancel from another client, then log in again on
  // this tab. gt.deletionScheduled must not survive — otherwise the public,
  // unguarded /account/deletion-scheduled route would render a purge date for
  // an account that is not actually scheduled.
  saveScheduledDeletion({
    deletion_requested_at: '2026-08-07T12:00:00Z',
    purge_at: '2026-08-14T12:00:00Z',
    days_left: 7,
  });
  server.use(
    http.post('/api/v1/auth/link', () =>
      HttpResponse.json({
        token: 'link-token',
        discord_id: '888',
        username: 'linked',
        timezone: 'Europe/Warsaw',
        is_admin: false,
        pending_deletion: null,
      }),
    ),
  );

  const { result } = renderHookWithProviders(() => useAuth());
  const ok = await result.current.handleLinkLogin('231996');

  expect(ok).toBe(true);
  expect(readScheduledDeletion()).toBeNull();
});

test('useAuth maps expired link code to Polish error', async () => {
  server.use(
    http.post('/api/v1/auth/link', () =>
      HttpResponse.json({ detail: 'Invalid' }, { status: 401 }),
    ),
  );

  const { result } = renderHookWithProviders(() => useAuth());
  const ok = await result.current.handleLinkLogin('000000');

  expect(ok).toBe(false);
  await waitFor(() =>
    expect(result.current.error).toBe(
      'Nieprawidłowy lub wygasły kod. Uruchom /login na Discordzie ponownie.',
    ),
  );
});