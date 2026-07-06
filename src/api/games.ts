import client from './client';
import type {
  EnrichmentStatus,
  GameListResponse,
  GameResolveResponse,
  GameSort,
  GameStats,
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