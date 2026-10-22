import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { DiscordCallbackPage } from './DiscordCallbackPage';
import { useAuthStore } from '../store/authStore';
import { beginDiscordLogin } from '../lib/discordOAuth';
import { renderWithProviders, resetStores } from '../../test/utils';
import { server } from '../../test/server';

beforeEach(() => {
  resetStores();
  sessionStorage.clear();
});

// The handoff is written by beginDiscordLogin before the redirect; replay it
// here so the callback sees the same state/verifier a real round-trip would.
async function startFlow(): Promise<string> {
  const url = new URL(await beginDiscordLogin());
  return url.searchParams.get('state')!;
}

function renderCallback(search: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/auth/discord/callback" element={<DiscordCallbackPage />} />
      <Route path="/" element={<p>DASHBOARD</p>} />
      <Route path="/account/pending-deletion" element={<p>PENDING</p>} />
    </Routes>,
    { route: `/auth/discord/callback${search}` },
  );
}

test('exchanges the code and lands the user in the app', async () => {
  const state = await startFlow();
  renderCallback(`?code=valid-code&state=${encodeURIComponent(state)}`);

  await waitFor(() => expect(screen.getByText('DASHBOARD')).toBeInTheDocument());
  expect(useAuthStore.getState().token).toBe('test-token');
});

test('routes a pending-deletion account to its own screen', async () => {
  server.use(
    http.post('/api/v1/auth/discord', () =>
      HttpResponse.json({
        token: 'test-token',
        discord_id: '123',
        username: 'testuser',
        timezone: 'Europe/Warsaw',
        is_admin: false,
        needs_server_join: false,
        pending_deletion: {
          deletion_requested_at: '2026-01-01T00:00:00Z',
          purge_at: '2026-01-31T00:00:00Z',
          days_left: 30,
        },
      }),
    ),
  );
  const state = await startFlow();
  renderCallback(`?code=valid-code&state=${encodeURIComponent(state)}`);

  await waitFor(() => expect(screen.getByText('PENDING')).toBeInTheDocument());
});

test('rejects a mismatched state without calling the backend', async () => {
  await startFlow();
  server.use(
    http.post('/api/v1/auth/discord', () => {
      throw new Error('backend must not be called on a state mismatch');
    }),
  );
  renderCallback('?code=valid-code&state=forged');

  await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  expect(useAuthStore.getState().token).toBeNull();
});

test('reports a denied authorization from Discord', async () => {
  await startFlow();
  renderCallback('?error=access_denied');

  await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  expect(useAuthStore.getState().token).toBeNull();
});

test('reports a failed code exchange and offers a way back to login', async () => {
  const state = await startFlow();
  renderCallback(`?code=rejected&state=${encodeURIComponent(state)}`);

  await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  expect(screen.getByRole('link', { name: /logowani/i })).toHaveAttribute('href', '/login');
});
