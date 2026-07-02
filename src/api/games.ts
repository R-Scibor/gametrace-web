import client from './client';
import type { EnrichmentStatus, GameListResponse, GameResolveResponse, Session } from '../types/api';

export interface GetGamesOptions {
  skip?: number;
  limit?: number;
  status?: EnrichmentStatus;
  q?: string;
  inLibrary?: boolean;
}

export const getGames = async (opts: GetGamesOptions = {}): Promise<GameListResponse> => {
  const { skip = 0, limit = 20, status, q, inLibrary } = opts;
  const response = await client.get<GameListResponse>('/games', {
    params: { skip, limit, status, q, in_library: inLibrary },
  });
  return response.data;
};

export const getGameSessions = async (gameId: number, skip = 0, limit = 20): Promise<Session[]> => {
  const response = await client.get<Session[]>(`/games/${gameId}/sessions`, { params: { skip, limit } });
  return response.data;
};

export const mergeGame = async (gameId: number, targetId: number): Promise<void> => {
  await client.post(`/games/${gameId}/merge/${targetId}`);
};

export const resolveGame = async (name: string): Promise<GameResolveResponse | null> => {
  const response = await client.get<GameResolveResponse | null>('/games/resolve', { params: { name } });
  return response.data;
};