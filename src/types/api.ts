import type { Language } from '../i18n/resolve';

// Auth
export interface LoginRequest { username: string; timezone?: string; }
export interface LoginResponse {
  token: string;
  discord_id: string;
  username: string;
  timezone: string;
  is_admin: boolean;
}

// Games
export interface GameBrief { id: number; primary_name: string; cover_image_url: string | null; }
export type EnrichmentStatus = 'PENDING' | 'ENRICHED' | 'NEEDS_REVIEW';
export type CoverSource = 'EXTERNAL' | 'CUSTOM';
export interface Game {
  id: number;
  primary_name: string;
  cover_image_url: string | null;
  cover_source: CoverSource;
  enrichment_status: EnrichmentStatus;
  is_ignored: boolean;
  is_accepted: boolean | null;
  total_seconds: number;
  last_played: string | null;
}

export type GameSort = 'name' | 'playtime' | 'last_played';

export type LibraryFilter = {
  type: 'genre' | 'theme' | 'developer' | 'publisher' | 'release_decade';
  value: string;
};

export interface GameListResponse {
  total: number;
  items: Game[];
}

export type AdminCatalogSort = 'sessions_desc' | 'id_asc' | 'name_asc';

export interface AdminGameItem {
  id: number;
  primary_name: string;
  enrichment_status: EnrichmentStatus;
  cover_image_url: string | null;
  cover_source: CoverSource;
  external_api_id: string | null;
  aliases: string[];
  session_count: number;
}

export interface AdminGameListResponse {
  total: number;
  items: AdminGameItem[];
}

export interface IGDBCandidate {
  igdb_id: number;
  name: string;
  year: number | null;
  cover_url: string | null;
  score: number;
}

export interface GameSuggestion {
  game_id: number;
  primary_name: string;
  cover_image_url: string | null;
  enrichment_status: EnrichmentStatus;
  score: number;
}

export interface GameSuggestResponse {
  total: number;
  items: GameSuggestion[];
}

/**
 * POST /games response. Deliberately NOT the web `Game` type: `Game` also carries
 * `total_seconds` and `last_played`, which this endpoint does not return.
 * `is_ignored` is always false and `is_accepted` always null here, even when the
 * caller already owns the game. Never seed a games query cache from this.
 */
export interface CreatedGame {
  id: number;
  primary_name: string;
  cover_image_url: string | null;
  cover_source: CoverSource;
  enrichment_status: EnrichmentStatus;
  is_ignored: boolean;
  is_accepted: boolean | null;
}

/** Exactly one mode. Sending both or neither is a 422 from the backend. */
export type CreateGamePayload =
  | { igdb_id: number; query?: string }
  | { name: string; unrecognized: true };

export interface AdminAliasResponse {
  game_id: number;
  discord_process_name: string;
}

export interface AdminGamesQuery {
  status?: EnrichmentStatus;
  q?: string;
  skip?: number;
  limit?: number;
  sort?: AdminCatalogSort;
}

export interface AdminOverviewResponse {
  user_count: number;
  session_count: number;
  total_seconds: number;
  game_count: number;
  needs_review_count: number;
  pending_enrichment_count: number;
  open_reports_count: number;
}

export interface GameStats {
  game_id: number;
  total_seconds: number;
  session_count: number;
  first_played: string;
  last_played: string;
}
export interface GamePreferenceUpdate {
  is_ignored?: boolean;
  is_accepted?: boolean;
  custom_tag?: string | null;
}

// Sessions
export type SessionStatus = 'ONGOING' | 'COMPLETED' | 'ERROR';
export type SessionSource = 'BOT' | 'MANUAL';
export interface Session {
  id: number; game_id: number; game: GameBrief; start_time: string; end_time: string | null;
  duration_seconds: number | null; status: SessionStatus; source: SessionSource;
  notes: string | null; created_at: string; deleted_at?: string | null;
}
export interface TrashSession extends Session { purges_at: string; }
export interface SessionCreate { game_id: number; start_time: string; end_time: string; }
export interface SessionPatch { end_time?: string; }
export interface ConflictResponse { detail: string; conflicting_session: Session; }

// Profile
export interface ProfileMe {
  discord_id: string;
  username: string;
  timezone: string;
  weekly_report_enabled: boolean;
  push_enabled: boolean;
  is_admin: boolean;
  language: Language;
}
export interface ProfileSettingsUpdate {
  timezone?: string; weekly_report_enabled?: boolean; push_enabled?: boolean;
  language?: Language;
}

// Stats
export interface GameStatEntry { game_id: number; game_name: string; cover_image_url: string | null; total_seconds: number; }
export interface PendingErrorEntry { id: number; game_id: number; game_name: string; start_time: string; notes: string | null; }
export interface StatsSummary {
  days: number;
  window_start: string | null;
  window_end: string;
  total_seconds: number;
  avg_session_seconds: number;
  longest_session_seconds: number;
  longest_session_game_id: number | null;
  longest_session_game_name: string | null;
  previous_total_seconds: number;
  new_games_count: number;
  per_game: GameStatEntry[];
  pending_errors: PendingErrorEntry[];
}
export interface ActiveSessionBrief { id: number; game_id: number; game_name: string; cover_image_url: string | null; start_time: string; }
export interface DashboardSummary {
  total_seconds_today: number; total_seconds_7d: number; total_seconds_30d: number;
  active_session: ActiveSessionBrief | null; pending_errors: PendingErrorEntry[];
}

export interface HeatmapCell { dow: number; hour: number; seconds: number; }
export interface HeatmapResponse { days: number; cells: HeatmapCell[]; }

export interface StreakResponse { current_streak: number; longest_streak: number; }

export type TrendGranularity = 'day' | 'week' | 'month';
export interface TrendBucket { bucket_start: string; total_seconds: number; }
export interface TrendResponse { granularity: TrendGranularity; buckets: TrendBucket[]; }

export interface GenreEntry { genre: string; total_seconds: number; }
export interface GenresResponse { items: GenreEntry[]; }

export interface ThemeEntry { theme: string; total_seconds: number; }
export interface ThemesResponse { items: ThemeEntry[]; }

export interface CompanyEntry { name: string; total_seconds: number; game_count: number; }
export interface CompaniesResponse { items: CompanyEntry[]; }

export interface ReleaseYearEntry { decade: string; total_seconds: number; }
export interface ReleaseYearsResponse { items: ReleaseYearEntry[]; }

export type BotStatus = 'online' | 'offline' | 'unknown';
export interface HealthResponse {
  status: string; version: string; commit_sha: string; build_time: string;
  api: { uptime_seconds: number };
  bot: { status: BotStatus; uptime_seconds: number | null; last_heartbeat_seconds_ago: number | null; };
}

// Voice
export interface TranscribeResponse {
  game: string | null; date: string | null; start_time: string | null; end_time: string | null;
  duration_minutes: number | null; raw_transcript: string;
}
export interface GameResolveResponse { game_id: number; name: string; }
export interface AddSessionPrefill {
  gameId?: number; date?: string | null; startTime?: string | null; endTime?: string | null; note?: string;
}

// Admin Reports
export type ReportStatus = 'open' | 'triaged' | 'closed';

export interface AdminReportItem {
  id: number;
  user_id: string;
  username: string | null;
  message: string;
  context: Record<string, unknown>;
  status: ReportStatus;
  created_at: string;
  admin_note: string | null;
}

export interface AdminReportListResponse {
  total: number;
  items: AdminReportItem[];
}

export interface AdminReportsQuery {
  status?: ReportStatus;
  q?: string;
  screen?: string;
  platform?: string;
  skip?: number;
  limit?: number;
}

export interface AdminReportFacet {
  value: string;
  count: number;
}

export interface AdminReportFacetsResponse {
  screens: AdminReportFacet[];
  platforms: AdminReportFacet[];
}

export type AdminReportPatch = {
  status?: ReportStatus;
  admin_note?: string | null;
};