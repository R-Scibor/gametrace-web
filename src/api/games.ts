import client from './client';
import type {
  CreatedGame,
  CreateGamePayload,
  EnrichmentStatus,
  Game,
  GameListResponse,
  GameResolveResponse,
  GameSort,
  GameStats,
  GameSuggestResponse,
  IGDBCandidate,
  LibraryFilter,
  Session,
} from '../types/api';

export interface GetGamesOptions {
  skip?: number;
  limit?: number;
  status?: EnrichmentStatus;
  q?: string;
  inLibrary?: boolean;
  sort?: GameSort;
  filter?: LibraryFilter;
}

export const getGames = async (opts: GetGamesOptions = {}): Promise<GameListResponse> => {
  const { skip = 0, limit = 20, status, q, inLibrary, sort, filter } = opts;
  const params: Record<string, unknown> = {
    skip,
    limit,
    status,
    q,
    in_library: inLibrary,
    sort,
  };
  if (filter) params[filter.type] = filter.value;
  const response = await client.get<GameListResponse>('/games', { params });
  return response.data;
};

export const getGame = async (gameId: number): Promise<Game> => {
  const response = await client.get<Game>(`/games/${gameId}`);
  return response.data;
};

export const getGameStats = async (gameId: number): Promise<GameStats> => {
  const response = await client.get<GameStats>(`/games/${gameId}/stats`);
  return response.data;
};

export const getGameSessions = async (gameId: number, skip = 0, limit = 20): Promise<Session[]> => {
  const response = await client.get<Session[]>(`/games/${gameId}/sessions`, { params: { skip, limit } });
  return response.data;
};

export const adminMergeGame = async (gameId: number, targetId: number): Promise<void> => {
  await client.post(`/admin/games/${gameId}/merge/${targetId}`);
};

export const resolveGame = async (name: string): Promise<GameResolveResponse | null> => {
  const response = await client.get<GameResolveResponse | null>('/games/resolve', { params: { name } });
  return response.data;
};

export const suggestGames = async (
  q: string,
  skip = 0,
  limit = 20,
): Promise<GameSuggestResponse> => {
  const response = await client.get<GameSuggestResponse>('/games/suggest', {
    params: { q, skip, limit },
  });
  return response.data;
};

/** POST /games/match returns a BARE LIST, not a {total, items} envelope. */
export const matchGames = async (query: string): Promise<IGDBCandidate[]> => {
  const response = await client.post<IGDBCandidate[]>('/games/match', { query });
  return response.data;
};

export const createGame = async (payload: CreateGamePayload): Promise<CreatedGame> => {
  const response = await client.post<CreatedGame>('/games', payload);
  return response.data;
};
/** Merge-report candidates: library + catalog-only games (mobile does the same dual fetch), minus the source game. */
export async function getMergeCandidates(
  sourceId: number,
  locale: string,
  q?: string,
): Promise<Game[]> {
  const base = { limit: 100, sort: 'name' as const, ...(q ? { q } : {}) };
  const [inLib, outLib] = await Promise.all([
    getGames(base),
    getGames({ ...base, inLibrary: false }),
  ]);
  const byId = new Map<number, Game>();
  for (const g of [...inLib.items, ...outLib.items]) byId.set(g.id, g);
  byId.delete(sourceId);
  return Array.from(byId.values()).sort((a, b) =>
    a.primary_name.localeCompare(b.primary_name, locale),
  );
}
