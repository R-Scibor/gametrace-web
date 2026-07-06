import type {
  ConflictResponse,
  DashboardSummary,
  Game,
  GameStatEntry,
  HeatmapResponse,
  ProfileMe,
  Session,
  StatsSummary,
  StreakResponse,
  TrashSession,
  TrendResponse,
} from '../src/types/api';

const gameBrief = {
  id: 1,
  primary_name: 'Wiedźmin 3',
  cover_image_url: null,
};

export const game: Game = {
  id: 1,
  primary_name: 'Wiedźmin 3',
  cover_image_url: null,
  cover_source: 'EXTERNAL',
  enrichment_status: 'ENRICHED',
  is_ignored: false,
  is_accepted: true,
  total_seconds: 14_400,
  last_played: '2026-06-10T20:00:00Z',
};

export const game2: Game = {
  id: 2,
  primary_name: 'Cyberpunk 2077',
  cover_image_url: null,
  cover_source: 'EXTERNAL',
  enrichment_status: 'ENRICHED',
  is_ignored: false,
  is_accepted: true,
  total_seconds: 7_200,
  last_played: '2026-06-08T18:00:00Z',
};

export const gameNeedsReview: Game = {
  id: 3,
  primary_name: 'Nieznana Gra',
  cover_image_url: null,
  cover_source: 'EXTERNAL',
  enrichment_status: 'NEEDS_REVIEW',
  is_ignored: false,
  is_accepted: false,
  total_seconds: 0,
  last_played: null,
};

export const gameIgnored: Game = {
  id: 4,
  primary_name: 'Stara Gra',
  cover_image_url: null,
  cover_source: 'EXTERNAL',
  enrichment_status: 'ENRICHED',
  is_ignored: true,
  is_accepted: true,
  total_seconds: 3_600,
  last_played: '2026-05-01T12:00:00Z',
};

export const gameStats = {
  game_id: 1,
  total_seconds: 7200,
  session_count: 1,
  first_played: '2026-06-10T18:00:00Z',
  last_played: '2026-06-10T20:00:00Z',
};

export const session: Session = {
  id: 1,
  game_id: 1,
  game: gameBrief,
  start_time: '2026-06-10T18:00:00Z',
  end_time: '2026-06-10T20:00:00Z',
  duration_seconds: 7200,
  status: 'COMPLETED',
  source: 'MANUAL',
  notes: 'Test session',
  created_at: '2026-06-10T20:00:00Z',
};

export const sessionError: Session = {
  ...session,
  id: 2,
  end_time: null,
  duration_seconds: null,
  status: 'ERROR',
  source: 'BOT',
  notes: null,
};

export const conflictResponse: ConflictResponse = {
  detail: 'Sesja nakłada się z istniejącą sesją.',
  conflicting_session: {
    ...session,
    id: 42,
    start_time: '2026-06-10T19:00:00Z',
    end_time: '2026-06-10T21:00:00Z',
  },
};

export const dashboardSummary: DashboardSummary = {
  total_seconds_today: 3600,
  total_seconds_7d: 36000,
  total_seconds_30d: 144000,
  active_session: {
    id: 99,
    game_id: 1,
    game_name: 'Wiedźmin 3',
    cover_image_url: null,
    start_time: '2026-06-15T10:00:00Z',
  },
  pending_errors: [],
};

export const dashboardNoActive: DashboardSummary = {
  ...dashboardSummary,
  active_session: null,
};

export const profileMe: ProfileMe = {
  discord_id: '123',
  username: 'testuser',
  timezone: 'Europe/Warsaw',
  weekly_report_enabled: true,
  push_enabled: false,
  is_admin: true,
};

export const trashSession: TrashSession = {
  ...session,
  id: 10,
  deleted_at: '2026-06-14T12:00:00Z',
  purges_at: '2026-07-14T12:00:00Z',
};

const perGame: GameStatEntry[] = [
  { game_id: 1, game_name: 'Wiedźmin 3', cover_image_url: null, total_seconds: 14400 },
  { game_id: 2, game_name: 'Cyberpunk 2077', cover_image_url: null, total_seconds: 7200 },
];

export const statsSummary: StatsSummary = {
  days: 30,
  window_start: '2026-05-16T00:00:00Z',
  window_end: '2026-06-15T00:00:00Z',
  total_seconds: 21600,
  avg_session_seconds: 5400,
  longest_session_seconds: 7200,
  longest_session_game_id: 1,
  longest_session_game_name: 'Wiedźmin 3',
  previous_total_seconds: 18000,
  new_games_count: 0,
  per_game: perGame,
  pending_errors: [],
};

export const statsSummary7d: StatsSummary = {
  ...statsSummary,
  days: 7,
  avg_session_seconds: 3600,
};

export const heatmap: HeatmapResponse = {
  days: 30,
  cells: [{ dow: 1, hour: 20, seconds: 3600 }],
};

export const streak: StreakResponse = {
  current_streak: 3,
  longest_streak: 7,
};

export const trend: TrendResponse = {
  granularity: 'week',
  buckets: [
    { bucket_start: '2026-06-02', total_seconds: 5400 },
    { bucket_start: '2026-06-09', total_seconds: 7200 },
  ],
};

export const gameFacets: Record<
  number,
  {
    genre?: string;
    theme?: string;
    developer?: string;
    publisher?: string;
    release_decade?: string;
  }
> = {
  1: {
    genre: 'RPG',
    theme: 'Fantasy',
    developer: 'CD Projekt Red',
    publisher: 'CD Projekt Red',
    release_decade: '2010s',
  },
  2: {
    genre: 'RPG',
    theme: 'Sci-fi',
    developer: 'CD Projekt Red',
    publisher: 'CD Projekt Red',
    release_decade: '2010s',
  },
};

export const fixtures = {
  dashboardSummary,
  dashboardNoActive,
  profileMe,
  game,
  gameNeedsReview,
  gameFacets,
  gamesList: { total: 2, items: [game, game2] },
  gamesReviewList: { total: 1, items: [gameNeedsReview] },
  gamesOtherList: { total: 2, items: [gameNeedsReview, gameIgnored] },
  gameStats,
  session,
  sessionError,
  sessions: [session, sessionError],
  recentSessions: [session, sessionError],
  trash: [trashSession],
  conflictResponse,
  statsSummary,
  statsSummary7d,
  heatmap,
  streak,
  trend,
  genres: { items: [{ genre: 'RPG', total_seconds: 14400 }] },
  genres7d: { items: [{ genre: 'Adventure', total_seconds: 3600 }] },
  themes: { items: [{ theme: 'Fantasy', total_seconds: 14400 }] },
  themes7d: { items: [{ theme: 'Open world', total_seconds: 3600 }] },
  companies: { items: [{ name: 'CD Projekt Red', total_seconds: 14400, game_count: 2 }] },
  companies7d: { items: [{ name: 'FromSoftware', total_seconds: 3600, game_count: 1 }] },
  releaseYears: { items: [{ decade: '2010s', total_seconds: 14400 }] },
  releaseYears7d: { items: [{ decade: '2000s', total_seconds: 3600 }] },
};