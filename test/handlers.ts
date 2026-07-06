import { http, HttpResponse } from 'msw';
import { fixtures } from './fixtures';

export const handlers = [
  http.post('/api/v1/auth/login', () => {
    return HttpResponse.json({
      token: 'test-token',
      discord_id: '123',
      username: 'testuser',
      timezone: 'Europe/Warsaw',
      is_admin: true,
    });
  }),

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

    return HttpResponse.json({ total: items.length, items });
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

  http.get('/api/v1/games/resolve', () => {
    return HttpResponse.json({ game_id: 1, name: 'Wiedźmin 3' });
  }),

  http.put('/api/v1/games/:id/cover', () => {
    return HttpResponse.json({ detail: 'Cover upload disabled' }, { status: 403 });
  }),

  http.put('/api/v1/user/preferences/:id', () => new HttpResponse(null, { status: 204 })),

  http.delete('/api/v1/user/preferences/:id', () => new HttpResponse(null, { status: 204 })),

  http.post('/api/v1/admin/games/:id/merge/:targetId', () => new HttpResponse(null, { status: 204 })),

  http.get('/api/v1/stats/summary', ({ request }) => {
    const days = Number(new URL(request.url).searchParams.get('days') ?? '30');
    if (days === 7) return HttpResponse.json(fixtures.statsSummary7d);
    return HttpResponse.json(fixtures.statsSummary);
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
];