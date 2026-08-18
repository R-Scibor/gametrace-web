import { http, HttpResponse } from 'msw';
import { fixtures } from './fixtures';

export const handlers = [
  http.get('/download/gametrace.apk', () =>
    new HttpResponse(new Uint8Array([0x50, 0x4b, 0x03, 0x04]), {
      status: 206,
      headers: { 'Content-Type': 'application/vnd.android.package-archive' },
    }),
  ),

  http.post('/api/v1/auth/link', async ({ request }) => {
    const body = (await request.json()) as { code?: string };
    if (body.code !== '231996') {
      return HttpResponse.json({ detail: 'Invalid code' }, { status: 401 });
    }
    return HttpResponse.json({
      token: 'test-token',
      discord_id: '123',
      username: 'testuser',
      timezone: 'Europe/Warsaw',
      is_admin: true,
      needs_server_join: false,
      pending_deletion: null,
    });
  }),

  http.post('/api/v1/auth/discord', async ({ request }) => {
    const body = (await request.json()) as { code?: string };
    if (body.code !== 'valid-code') {
      return HttpResponse.json({ detail: 'Discord authorization failed' }, { status: 401 });
    }
    return HttpResponse.json({
      token: 'test-token',
      discord_id: '123',
      username: 'testuser',
      timezone: 'Europe/Warsaw',
      is_admin: true,
      needs_server_join: false,
      pending_deletion: null,
    });
  }),

  http.post('/api/v1/auth/logout', () => HttpResponse.json({ ok: true })),

  http.get('/api/v1/stats/dashboard', () => {
    return HttpResponse.json(fixtures.dashboardSummary);
  }),

  http.get('/api/v1/profile/me', () => {
    return HttpResponse.json(fixtures.profileMe);
  }),

  http.put('/api/v1/profile/settings', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...fixtures.profileMe, ...body });
  }),

  http.get('/api/v1/health', () => {
    return HttpResponse.json({
      status: 'ok',
      version: '1.0.0-test',
      commit_sha: 'abc123',
      build_time: '2026-01-01T00:00:00Z',
      api: { uptime_seconds: 3600 },
      bot: { status: 'online', uptime_seconds: 1800, last_heartbeat_seconds_ago: 5 },
    });
  }),

  http.get('/api/v1/sessions/trash', () => HttpResponse.json(fixtures.trash)),

  http.get('/api/v1/sessions', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.getAll('status');
    let items = fixtures.recentSessions;
    if (status.length > 0) {
      items = items.filter((s) => status.includes(s.status));
    }
    return HttpResponse.json(items);
  }),

  http.get('/api/v1/sessions/:id', ({ params }) => {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
    }
    const found = fixtures.sessions.find((s) => s.id === id);
    if (!found) return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
    return HttpResponse.json(found);
  }),

  http.post('/api/v1/sessions', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...fixtures.session, ...(body as object) });
  }),

  http.patch('/api/v1/sessions/:id', async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({ ...fixtures.session, id: Number(params.id), ...(body as object) });
  }),

  http.delete('/api/v1/sessions/:id', ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('hard') === 'true') {
      return new HttpResponse(null, { status: 204 });
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/v1/sessions/:id/restore', ({ params }) => {
    return HttpResponse.json({ ...fixtures.session, id: Number(params.id) });
  }),

  http.get('/api/v1/games', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const inLibrary = url.searchParams.get('in_library');
    const q = url.searchParams.get('q')?.toLowerCase();
    const sort = url.searchParams.get('sort') ?? 'name';
    const genre = url.searchParams.get('genre');
    const theme = url.searchParams.get('theme');
    const developer = url.searchParams.get('developer');
    const publisher = url.searchParams.get('publisher');
    const releaseDecade = url.searchParams.get('release_decade');
    const skip = Number(url.searchParams.get('skip') ?? '0');
    const limit = Number(url.searchParams.get('limit') ?? '20');

    // Backend caps limit at 100 (Query(..., le=100)); mirror that here.
    if (limit > 100) {
      return HttpResponse.json({ detail: 'limit must be <= 100' }, { status: 422 });
    }

    let list = fixtures.gamesList;
    if (status === 'NEEDS_REVIEW') list = fixtures.gamesReviewList;
    else if (inLibrary === 'false') list = fixtures.gamesOtherList;

    let items = [...list.items];

    if (q) {
      items = items.filter((g) => g.primary_name.toLowerCase().includes(q));
    }

    if (genre) {
      items = items.filter((g) => fixtures.gameFacets[g.id]?.genre === genre);
    }
    if (theme) {
      items = items.filter((g) => fixtures.gameFacets[g.id]?.theme === theme);
    }
    if (developer) {
      items = items.filter((g) => fixtures.gameFacets[g.id]?.developer === developer);
    }
    if (publisher) {
      items = items.filter((g) => fixtures.gameFacets[g.id]?.publisher === publisher);
    }
    if (releaseDecade) {
      items = items.filter((g) => fixtures.gameFacets[g.id]?.release_decade === releaseDecade);
    }

    if (sort === 'playtime') {
      items.sort((a, b) => b.total_seconds - a.total_seconds);
    } else if (sort === 'last_played') {
      items.sort((a, b) => {
        const aTs = a.last_played ? Date.parse(a.last_played) : 0;
        const bTs = b.last_played ? Date.parse(b.last_played) : 0;
        return bTs - aTs;
      });
    } else {
      items.sort((a, b) => a.primary_name.localeCompare(b.primary_name));
    }

    return HttpResponse.json({ total: items.length, items: items.slice(skip, skip + limit) });
  }),

  // MUST stay above the '/api/v1/games/:id' handler below, which would otherwise
  // capture this path with params.id === 'suggest' and 404 it.
  http.get('/api/v1/games/suggest', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim();
    if (!q) return HttpResponse.json({ detail: 'q required' }, { status: 422 });
    // Alias hit: the catalog resolves "witcher" to a game the user already owns
    // (game_id 1, "Wiedźmin 3"). The client's plain substring filter cannot find it,
    // so this is the case the promote-into-library branch exists for.
    if (q.toLowerCase().includes('witcher')) {
      return HttpResponse.json(fixtures.gameSuggestAlias);
    }
    // Substring-match the fixture so unrelated queries return nothing. Tests depend
    // on this: a handler that returns Hades for every query makes the number of
    // keyboard-reachable items unpredictable.
    const items = fixtures.gameSuggest.items.filter((i) =>
      i.primary_name.toLowerCase().includes(q.toLowerCase()),
    );
    return HttpResponse.json({ total: items.length, items });
  }),

  // MUST stay above '/api/v1/games/:id', which would otherwise capture this path.
  http.get('/api/v1/games/resolve', ({ request }) => {
    const name = new URL(request.url).searchParams.get('name') ?? '';
    if (name.toLowerCase().includes('unknown')) return HttpResponse.json(null);
    return HttpResponse.json({ game_id: 1, name: 'Wiedźmin 3' });
  }),

  http.post('/api/v1/games/match', async ({ request }) => {
    const body = (await request.json()) as { query?: string };
    const query = body.query?.trim();
    if (!query) return HttpResponse.json({ detail: 'query required' }, { status: 422 });
    if (query === 'igdb-down') {
      return HttpResponse.json({ detail: 'IGDB unavailable' }, { status: 503 });
    }
    if (query === 'no-online-results') return HttpResponse.json([]);
    return HttpResponse.json(fixtures.igdbCandidates);
  }),

  http.post('/api/v1/games', async ({ request }) => {
    const body = (await request.json()) as {
      igdb_id?: number; name?: string; unrecognized?: boolean;
    };
    if (body.igdb_id != null && body.name != null) {
      return HttpResponse.json({ detail: 'exactly one mode' }, { status: 422 });
    }
    if (body.igdb_id === 99999) {
      return HttpResponse.json({ detail: 'IGDB id not found' }, { status: 404 });
    }
    if (body.name === 'create-fails') {
      return HttpResponse.json({ detail: 'IGDB unavailable' }, { status: 503 });
    }
    if (body.igdb_id != null) {
      return HttpResponse.json(fixtures.createdGameLinked, { status: 201 });
    }
    if (body.name) {
      return HttpResponse.json(
        { ...fixtures.createdGameUnrecognized, primary_name: body.name },
        { status: 201 },
      );
    }
    return HttpResponse.json({ detail: 'exactly one mode' }, { status: 422 });
  }),

  http.get('/api/v1/games/:id', ({ params }) => {
    const id = Number(params.id);
    const all = [...fixtures.gamesList.items, ...fixtures.gamesReviewList.items, ...fixtures.gamesOtherList.items];
    const found = all.find((g) => g.id === id);
    if (!found) return HttpResponse.json({ detail: 'Game not found' }, { status: 404 });
    return HttpResponse.json(found);
  }),

  http.get('/api/v1/games/:id/stats', ({ params }) => {
    return HttpResponse.json({ ...fixtures.gameStats, game_id: Number(params.id) });
  }),

  http.get('/api/v1/games/:id/sessions', ({ request }) => {
    const url = new URL(request.url);
    const skip = Number(url.searchParams.get('skip') ?? 0);
    const limit = Number(url.searchParams.get('limit') ?? 100);
    return HttpResponse.json(fixtures.sessions.slice(skip, skip + limit));
  }),

  http.put('/api/v1/games/:id/cover', () => {
    return HttpResponse.json({ detail: 'Cover upload disabled' }, { status: 403 });
  }),

  http.put('/api/v1/user/preferences/:id', () => new HttpResponse(null, { status: 204 })),

  http.delete('/api/v1/user/preferences/:id', () => new HttpResponse(null, { status: 204 })),

  http.post('/api/v1/admin/games/:id/merge/:targetId', () => new HttpResponse(null, { status: 204 })),

  http.put('/api/v1/admin/games/:id/cover', async ({ params, request }) => {
    const body = (await request.json()) as { extension?: string };
    const id = Number(params.id);
    const ext = body.extension ?? 'jpg';
    return HttpResponse.json({
      ...fixtures.game,
      id,
      cover_image_url: `/covers/${id}.${ext}`,
      cover_source: 'CUSTOM',
    });
  }),

  http.get('/api/v1/admin/games', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const q = url.searchParams.get('q')?.toLowerCase() ?? '';
    let items = fixtures.adminCatalogGames.items;
    if (status) {
      items = items.filter((g) => g.enrichment_status === status);
    }
    if (q) {
      items = items.filter(
        (g) =>
          g.primary_name.toLowerCase().includes(q) ||
          g.aliases.some((a) => a.toLowerCase().includes(q)),
      );
    }
    const skip = Number(url.searchParams.get('skip') ?? 0);
    const limit = Number(url.searchParams.get('limit') ?? 50);
    const page = items.slice(skip, skip + limit);
    return HttpResponse.json({ total: items.length, items: page });
  }),

  http.post('/api/v1/admin/games/:id/enrich', () =>
    HttpResponse.json({ queued: true }, { status: 202 }),
  ),

  http.post('/api/v1/admin/games/match', async ({ request }) => {
    const body = (await request.json()) as { query?: string };
    if (!body.query?.trim()) {
      return HttpResponse.json({ detail: 'query required' }, { status: 422 });
    }
    return HttpResponse.json(fixtures.igdbCandidates);
  }),

  http.post('/api/v1/admin/games/:id/igdb-link', async ({ params, request }) => {
    const body = (await request.json()) as { igdb_id: number };
    const id = Number(params.id);
    const item = fixtures.adminCatalogGames.items.find((g) => g.id === id);
    if (!item) return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
    if (body.igdb_id === 99999) {
      return HttpResponse.json(
        { detail: { message: 'IGDB id already linked to another game', conflicting_game_id: 33 } },
        { status: 409 },
      );
    }
    return HttpResponse.json({
      id,
      primary_name: fixtures.igdbCandidates[0].name,
      cover_image_url: fixtures.igdbCandidates[0].cover_url,
      cover_source: 'EXTERNAL',
      enrichment_status: 'ENRICHED',
      is_ignored: false,
      is_accepted: null,
      total_seconds: 0,
      last_played: null,
    });
  }),

  http.post('/api/v1/admin/games/:id/aliases', async ({ params, request }) => {
    const body = (await request.json()) as { discord_process_name?: string };
    const name = body.discord_process_name?.trim() ?? '';
    if (!name) return HttpResponse.json({ detail: 'blank' }, { status: 422 });
    if (name === 'taken.exe') {
      return HttpResponse.json({ detail: { conflicting_game_id: 33 } }, { status: 409 });
    }
    return HttpResponse.json(
      { game_id: Number(params.id), discord_process_name: name },
      { status: 201 },
    );
  }),

  http.get('/api/v1/admin/stats/overview', () =>
    HttpResponse.json(fixtures.adminOverview),
  ),

  http.get('/api/v1/admin/reports', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const q = url.searchParams.get('q')?.toLowerCase();
    const screen = url.searchParams.get('screen');
    const platform = url.searchParams.get('platform');
    let items = fixtures.adminReports.items;
    if (status) items = items.filter((r) => r.status === status);
    if (q) items = items.filter((r) => r.message.toLowerCase().includes(q));
    if (screen) items = items.filter((r) => r.context.screen === screen);
    if (platform) items = items.filter((r) => r.context.platform === platform);
    return HttpResponse.json({ total: items.length, items });
  }),

  http.get('/api/v1/admin/reports/facets', () =>
    HttpResponse.json(fixtures.adminReportFacets),
  ),

  http.patch('/api/v1/admin/reports/:id', async ({ params, request }) => {
    const id = Number(params.id);
    const body = (await request.json()) as {
      status?: 'open' | 'triaged' | 'closed';
      admin_note?: string | null;
    };
    const item = fixtures.adminReports.items.find((r) => r.id === id);
    if (!item) {
      return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json({
      ...item,
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.admin_note !== undefined ? { admin_note: body.admin_note } : {}),
    });
  }),

  http.delete('/api/v1/admin/reports/:id', ({ params }) => {
    const id = Number(params.id);
    const exists = fixtures.adminReports.items.some((r) => r.id === id);
    if (!exists) {
      return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/v1/stats/summary', ({ request }) => {
    const days = Number(new URL(request.url).searchParams.get('days') ?? '30');
    if (days === 7) return HttpResponse.json(fixtures.statsSummary7d);
    if (days === 30) return HttpResponse.json(fixtures.statsSummary);
    return HttpResponse.json({ ...fixtures.statsSummary, days });
  }),

  http.get('/api/v1/stats/heatmap', () => HttpResponse.json(fixtures.heatmap)),

  http.get('/api/v1/stats/streak', () => HttpResponse.json(fixtures.streak)),

  http.get('/api/v1/stats/trend', () => HttpResponse.json(fixtures.trend)),

  http.get('/api/v1/stats/genres', ({ request }) => {
    const days = Number(new URL(request.url).searchParams.get('days') ?? '30');
    return HttpResponse.json(days === 7 ? fixtures.genres7d : fixtures.genres);
  }),

  http.get('/api/v1/stats/themes', ({ request }) => {
    const days = Number(new URL(request.url).searchParams.get('days') ?? '30');
    return HttpResponse.json(days === 7 ? fixtures.themes7d : fixtures.themes);
  }),

  http.get('/api/v1/stats/companies', ({ request }) => {
    const days = Number(new URL(request.url).searchParams.get('days') ?? '30');
    return HttpResponse.json(days === 7 ? fixtures.companies7d : fixtures.companies);
  }),

  http.get('/api/v1/stats/release-years', ({ request }) => {
    const days = Number(new URL(request.url).searchParams.get('days') ?? '30');
    return HttpResponse.json(days === 7 ? fixtures.releaseYears7d : fixtures.releaseYears);
  }),

  http.post('/api/v1/voice/transcribe', () => {
    return HttpResponse.json({
      game: 'Wiedźmin 3',
      date: '2026-06-15',
      start_time: '18:00',
      end_time: '20:00',
      duration_minutes: 120,
      raw_transcript: 'Grałem w Wiedźmina',
    });
  }),

  http.post('/api/v1/profile/me/deletion', () =>
    HttpResponse.json(fixtures.pendingDeletion, { status: 202 }),
  ),

  http.delete('/api/v1/profile/me/deletion', () =>
    HttpResponse.json({ detail: 'Account deletion cancelled' }),
  ),
];