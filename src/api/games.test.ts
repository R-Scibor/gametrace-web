import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createGame, getGames, matchGames, suggestGames } from './games';
import { server } from '../../test/server';

describe('games ladder API', () => {
  it('suggestGames returns catalog items for a query', async () => {
    const res = await suggestGames('hades');
    expect(res.items[0].game_id).toBe(901);
    expect(res.items[0].primary_name).toBe('Hades');
  });

  it('matchGames returns a bare list of IGDB candidates', async () => {
    const res = await matchGames('kingdom hearts');
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].igdb_id).toBe(11142);
  });

  it('createGame links an IGDB candidate and returns a catalog id', async () => {
    const created = await createGame({ igdb_id: 11142, query: 'kingdom hearts' });
    expect(created.id).toBe(902);
    expect(created.enrichment_status).toBe('ENRICHED');
  });

  it('createGame creates an unrecognized game', async () => {
    const created = await createGame({ name: 'My Tiny Jam Game', unrecognized: true });
    expect(created.primary_name).toBe('My Tiny Jam Game');
    expect(created.enrichment_status).toBe('NEEDS_REVIEW');
  });

  it('getGames passes order param only when provided', async () => {
    let capturedOrder: string | null = null;
    server.use(
      http.get('/api/v1/games', ({ request }) => {
        capturedOrder = new URL(request.url).searchParams.get('order');
        return HttpResponse.json({ total: 0, items: [] });
      }),
    );
    await getGames({ sort: 'playtime', order: 'asc' });
    expect(capturedOrder).toBe('asc');

    await getGames({ sort: 'playtime' });
    expect(capturedOrder).toBeNull();
  });
});
