import { listSessions } from './sessions';
import { server } from '../../test/server';
import { http, HttpResponse } from 'msw';
import { beforeEach, test, expect } from 'vitest';
import { fixtures } from '../../test/fixtures';

beforeEach(() => {
  server.use(
    http.get('/api/v1/sessions', ({ request }) => {
      const url = new URL(request.url);
      const statuses = url.searchParams.getAll('status');
      const limit = url.searchParams.get('limit');

      if (statuses.includes('COMPLETED') && statuses.includes('ERROR') && limit === '5') {
        return HttpResponse.json(fixtures.recentSessions);
      }

      return HttpResponse.json([]);
    }),
  );
});

test('listSessions serializes repeated status params for FastAPI', async () => {
  let capturedUrl = '';
  server.use(
    http.get('/api/v1/sessions', ({ request }) => {
      capturedUrl = request.url;
      return HttpResponse.json(fixtures.recentSessions);
    }),
  );

  await listSessions({ status: ['COMPLETED', 'ERROR'], limit: 5 });

  const url = new URL(capturedUrl);
  expect(url.searchParams.getAll('status')).toEqual(['COMPLETED', 'ERROR']);
  expect(url.searchParams.get('limit')).toBe('5');
  expect(capturedUrl).not.toContain('status[]');
});