import client from './client';
import type {
  AdminAliasResponse,
  AdminGameListResponse,
  AdminGamesQuery,
  AdminOverviewResponse,
  AdminReportItem,
  AdminReportListResponse,
  AdminReportsQuery,
  Game,
  IGDBCandidate,
} from '../types/api';

export interface AdminCoverUpload {
  image_base64: string;
  extension: string;
}

export const adminUploadCover = async (
  gameId: number,
  body: AdminCoverUpload,
): Promise<Game> => {
  const response = await client.put<Game>(`/admin/games/${gameId}/cover`, body);
  return response.data;
};

export const getAdminGames = async (
  query: AdminGamesQuery = {},
): Promise<AdminGameListResponse> => {
  const response = await client.get<AdminGameListResponse>('/admin/games', {
    params: {
      status: query.status,
      q: query.q || undefined,
      skip: query.skip ?? 0,
      limit: query.limit ?? 50,
      sort: query.sort ?? 'sessions_desc',
    },
  });
  return response.data;
};

export const requeueEnrichment = async (gameId: number): Promise<{ queued: boolean }> => {
  const response = await client.post<{ queued: boolean }>(`/admin/games/${gameId}/enrich`);
  return response.data;
};

export const adminMatchGames = async (query: string): Promise<IGDBCandidate[]> => {
  const response = await client.post<IGDBCandidate[]>('/admin/games/match', { query });
  return response.data;
};

export const linkGameToIgdb = async (gameId: number, igdbId: number): Promise<Game> => {
  const response = await client.post<Game>(`/admin/games/${gameId}/igdb-link`, {
    igdb_id: igdbId,
  });
  return response.data;
};

export const addGameAlias = async (
  gameId: number,
  discordProcessName: string,
): Promise<AdminAliasResponse> => {
  const response = await client.post<AdminAliasResponse>(`/admin/games/${gameId}/aliases`, {
    discord_process_name: discordProcessName,
  });
  return response.data;
};

export const getAdminStatsOverview = async (): Promise<AdminOverviewResponse> => {
  const response = await client.get<AdminOverviewResponse>('/admin/stats/overview');
  return response.data;
};

export const getAdminReports = async (
  query: AdminReportsQuery = {},
): Promise<AdminReportListResponse> => {
  const response = await client.get<AdminReportListResponse>('/admin/reports', {
    params: {
      status: query.status,
      skip: query.skip ?? 0,
      limit: query.limit ?? 50,
    },
  });
  return response.data;
};

export const patchAdminReport = async (
  reportId: number,
  body: { status: 'triaged' | 'closed' },
): Promise<AdminReportItem> => {
  const response = await client.patch<AdminReportItem>(`/admin/reports/${reportId}`, body);
  return response.data;
};