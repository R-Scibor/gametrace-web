import client from './client';
import { useAuthStore } from '../store/authStore';
import { server } from '../../test/server';
import { http, HttpResponse } from 'msw';

beforeEach(() => {
  useAuthStore.getState().logout();
});

test('client adds bearer token when authenticated', async () => {
  useAuthStore.getState().login('test-token', { discordId: '1', username: 'test' });
  
  let receivedHeader = null;
  server.use(
    http.get('http://localhost:3000/api/v1/test', ({ request }) => {
      receivedHeader = request.headers.get('Authorization');
      return HttpResponse.json({ ok: true });
    })
  );

  await client.get('/test');
  expect(receivedHeader).toBe('Bearer test-token');
});

test('client handles 401 and logs out', async () => {
  useAuthStore.getState().login('test-token', { discordId: '1', username: 'test' });
  
  server.use(
    http.get('http://localhost:3000/api/v1/test', () => {
      return new HttpResponse(null, { status: 401 });
    })
  );

  await expect(client.get('/test')).rejects.toThrow();
  expect(useAuthStore.getState().isAuthenticated).toBe(false);
});
