import { beforeEach, test, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import {
  getAdminGames,
  requeueEnrichment,
  adminMatchGames,
  linkGameToIgdb,
  addGameAlias,
} from './admin';

beforeEach(() => {
  server.use(
    http.get('/api/v1/admin/games', ({ request }) => {
      const url = new URL(request.url);
      expect(url.searchParams.get('status')).toBe('NEEDS_REVIEW');
      expect(url.searchParams.get('skip')).toBe('0');
      return HttpResponse.json({
        total: 1,
        items: [
          {
            id: 45,
            primary_name: 'Stub',
            enrichment_status: 'NEEDS_REVIEW',
            cover_image_url: null,
            cover_source: 'EXTERNAL',
            external_api_id: null,
            aliases: ['foo.exe'],
            session_count: 3,
          },
        ],
      });
    }),
    http.post('/api/v1/admin/games/45/enrich', () =>
      HttpResponse.json({ queued: true }, { status: 202 }),
    ),
    http.post('/api/v1/admin/games/match', async ({ request }) => {
      const body = (await request.json()) as { query: string };
      expect(body.query).toBe('Hades');
      return HttpResponse.json([
        {
          igdb_id: 114402,
          name: 'Hades',
          year: 2020,
          cover_url: 'https://example.com/cover.jpg',
          score: 0.95,
        },
      ]);
    }),
    http.post('/api/v1/admin/games/45/igdb-link', async ({ request }) => {
      const body = (await request.json()) as { igdb_id: number };
      expect(body.igdb_id).toBe(114402);
      return HttpResponse.json({
        id: 45,
        primary_name: 'Hades',
        cover_image_url: 'https://example.com/cover.jpg',
        cover_source: 'EXTERNAL',
        enrichment_status: 'ENRICHED',
        is_ignored: false,
        is_accepted: null,
        total_seconds: 0,
        last_played: null,
      });
    }),
    http.post('/api/v1/admin/games/45/aliases', async ({ request }) => {
      const body = (await request.json()) as { discord_process_name: string };
      expect(body.discord_process_name).toBe('Hades.exe');
      return HttpResponse.json(
        { game_id: 45, discord_process_name: 'Hades.exe' },
        { status: 201 },
      );
    }),
  );
});

test('getAdminGames passes query params', async () => {
  const res = await getAdminGames({ status: 'NEEDS_REVIEW', skip: 0 });
  expect(res.total).toBe(1);
  expect(res.items[0].id).toBe(45);
});

test('requeueEnrichment returns queued flag', async () => {
  const res = await requeueEnrichment(45);
  expect(res.queued).toBe(true);
});

test('adminMatchGames posts query body', async () => {
  const res = await adminMatchGames('Hades');
  expect(res[0].igdb_id).toBe(114402);
});

test('linkGameToIgdb posts igdb_id', async () => {
  const res = await linkGameToIgdb(45, 114402);
  expect(res.enrichment_status).toBe('ENRICHED');
});

test('addGameAlias posts discord_process_name', async () => {
  const res = await addGameAlias(45, 'Hades.exe');
  expect(res.discord_process_name).toBe('Hades.exe');
});