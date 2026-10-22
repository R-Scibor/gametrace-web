import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach } from 'vitest';
import { useAuth } from './useAuth';
import { useAuthStore } from '../store/authStore';
import { useServerJoinStore } from '../store/serverJoinStore';
import i18n from '../i18n';
import { saveScheduledDeletion, readScheduledDeletion } from '../lib/accountDeletion';
import { renderHookWithProviders, resetStores } from '../../test/utils';
import { server } from '../../test/server';
import { fixtures } from '../../test/fixtures';

beforeEach(() => {
  resetStores();
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
  saveScheduledDeletion(fixtures.pendingDeletion);
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
test('useAuth stores token on successful Discord login', async () => {
  let capturedBody: Record<string, string> = {};
  server.use(
    http.post('/api/v1/auth/discord', async ({ request }) => {
      capturedBody = (await request.json()) as Record<string, string>;
      return HttpResponse.json({
        token: 'discord-token',
        discord_id: '777',
        username: 'oauthuser',
        timezone: 'Europe/Warsaw',
        is_admin: false,
        needs_server_join: false,
        pending_deletion: null,
      });
    }),
  );

  const { result } = renderHookWithProviders(() => useAuth());
  const ok = await result.current.handleDiscordLogin('auth-code', 'verifier', 'https://x/cb');

  expect(ok).toBe(true);
  expect(capturedBody).toEqual({
    code: 'auth-code',
    code_verifier: 'verifier',
    redirect_uri: 'https://x/cb',
  });
  await waitFor(() => {
    expect(useAuthStore.getState().token).toBe('discord-token');
    expect(useAuthStore.getState().user?.username).toBe('oauthuser');
  });
  expect(useServerJoinStore.getState().visible).toBe(false);
});

test('useAuth raises the server-join prompt when the account is outside the guild', async () => {
  server.use(
    http.post('/api/v1/auth/discord', () =>
      HttpResponse.json({
        token: 'discord-token',
        discord_id: '777',
        username: 'oauthuser',
        timezone: 'Europe/Warsaw',
        is_admin: false,
        needs_server_join: true,
        pending_deletion: null,
      }),
    ),
  );

  const { result } = renderHookWithProviders(() => useAuth());
  await result.current.handleDiscordLogin('auth-code', 'verifier', 'https://x/cb');

  await waitFor(() => expect(useServerJoinStore.getState().visible).toBe(true));
});

test('useAuth surfaces a Discord login failure without storing a token', async () => {
  server.use(
    http.post('/api/v1/auth/discord', () =>
      HttpResponse.json({ detail: 'Discord authorization failed' }, { status: 401 }),
    ),
  );

  const { result } = renderHookWithProviders(() => useAuth());
  const ok = await result.current.handleDiscordLogin('bad', 'verifier', 'https://x/cb');

  expect(ok).toBe(false);
  expect(useAuthStore.getState().token).toBeNull();
  await waitFor(() => expect(result.current.error).toBeTruthy());
});

test('useAuth reports an unregistered redirect uri distinctly', async () => {
  server.use(
    http.post('/api/v1/auth/discord', () =>
      HttpResponse.json({ detail: 'redirect_uri not allowed' }, { status: 400 }),
    ),
  );

  const { result } = renderHookWithProviders(() => useAuth());
  await result.current.handleDiscordLogin('code', 'verifier', 'https://x/cb');

  await waitFor(() =>
    expect(result.current.error).toBe(i18n.t('auth:errors.discordRedirect')),
  );
});
