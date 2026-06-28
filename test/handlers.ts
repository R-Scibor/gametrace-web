import { http, HttpResponse } from 'msw';
import { fixtures } from './fixtures';

export const handlers = [
  http.post('/api/v1/auth/login', () => {
    return HttpResponse.json({
      token: 'test-token',
      discord_id: '123',
      username: 'testuser',
      timezone: 'Europe/Warsaw',
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
    if (status === 'NEEDS_REVIEW') {
      return HttpResponse.json(fixtures.gamesReview);
    }
    return HttpResponse.json(fixtures.games);
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

  http.put('/api/v1/games/:id/cover', ({ params }) => {
    return HttpResponse.json({ ...fixtures.game, id: Number(params.id) });
  }),

  http.put('/api/v1/user/preferences/:id', () => new HttpResponse(null, { status: 204 })),

  http.delete('/api/v1/user/preferences/:id', () => new HttpResponse(null, { status: 204 })),

  http.get('/api/v1/stats/summary', () => HttpResponse.json(fixtures.statsSummary)),

  http.get('/api/v1/stats/heatmap', () => HttpResponse.json(fixtures.heatmap)),

  http.get('/api/v1/stats/streak', () => HttpResponse.json(fixtures.streak)),

  http.get('/api/v1/stats/weekly-trend', () => HttpResponse.json(fixtures.weeklyTrend)),

  http.get('/api/v1/stats/genres', () => HttpResponse.json(fixtures.genres)),

  http.get('/api/v1/stats/themes', () => HttpResponse.json(fixtures.themes)),

  http.get('/api/v1/stats/companies', () => HttpResponse.json(fixtures.companies)),

  http.get('/api/v1/stats/release-years', () => HttpResponse.json(fixtures.releaseYears)),

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