import client from './client';
import { useAuthStore } from '../store/authStore';
import { queryClient } from '../lib/queryClient';
import { server } from '../../test/server';
import { http, HttpResponse } from 'msw';
import { beforeEach, test, expect } from 'vitest';

beforeEach(() => {
  useAuthStore.getState().logout();
  queryClient.clear();
});

test('client adds bearer token when authenticated', async () => {
  useAuthStore.getState().login('test-token', { discordId: '1', username: 'test' });

  let receivedHeader: string | null = null;
  server.use(
    http.get('http://localhost:3000/api/v1/test', ({ request }) => {
      receivedHeader = request.headers.get('Authorization');
      return HttpResponse.json({ ok: true });
    }),
  );

  await client.get('/test');
  expect(receivedHeader).toBe('Bearer test-token');
});

test('client handles 401 and tears down auth', async () => {
  useAuthStore.getState().login('test-token', { discordId: '1', username: 'test' });
  queryClient.setQueryData(['cached'], { value: 1 });

  server.use(
    http.get('http://localhost:3000/api/v1/test', () => new HttpResponse(null, { status: 401 })),
  );

  await expect(client.get('/test')).rejects.toThrow();
  expect(useAuthStore.getState().isAuthenticated).toBe(false);
  expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
});

test('client does not tear down auth on failed login attempts', async () => {
  useAuthStore.getState().login('test-token', { discordId: '1', username: 'test' });

  server.use(
    http.post('/api/v1/auth/link', () =>
      HttpResponse.json({ detail: 'Invalid or expired code' }, { status: 401 }),
    ),
  );

  await expect(client.post('/auth/link', { code: '000000' })).rejects.toThrow();
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
  expect(useAuthStore.getState().token).toBe('test-token');
});

test('records pendingDeletion from the grace-period 403 without tearing down auth', async () => {
  useAuthStore.getState().login('test-token', { discordId: '1', username: 'test' });
  server.use(
    http.get('/api/v1/profile/me', () =>
      HttpResponse.json(
        {
          detail: {
            detail: 'Account scheduled for deletion',
            deletion_requested_at: '2026-08-07T12:00:00Z',
            purge_at: '2026-08-14T12:00:00Z',
            days_left: 7,
          },
        },
        { status: 403 },
      ),
    ),
  );

  await expect(client.get('/profile/me')).rejects.toThrow();

  expect(useAuthStore.getState().pendingDeletion?.days_left).toBe(7);
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
});

test('leaves an ordinary 403 alone', async () => {
  useAuthStore.getState().login('test-token', { discordId: '1', username: 'test' });
  server.use(
    http.get('/api/v1/admin/stats/overview', () =>
      HttpResponse.json({ detail: 'Admin access required' }, { status: 403 }),
    ),
  );

  await expect(client.get('/admin/stats/overview')).rejects.toThrow();

  expect(useAuthStore.getState().pendingDeletion).toBeNull();
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
});