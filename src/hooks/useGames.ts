import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getGames } from '../api/games';
import { qk } from '../lib/queryKeys';
import type { EnrichmentStatus } from '../types/api';

export const GAMES_PAGE_SIZE = 40;

export function useGamesAll(status?: EnrichmentStatus) {
  return useQuery({
    queryKey: qk.games(status),
    queryFn: () => getGames(0, 1000, status),
  });
}

export function useGamesPaginated(status?: EnrichmentStatus) {
  return useInfiniteQuery({
    queryKey: [...qk.games(status), 'pages'] as const,
    queryFn: ({ pageParam }) => getGames(pageParam, GAMES_PAGE_SIZE, status),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _all, lastPageParam) =>
      lastPage.length < GAMES_PAGE_SIZE ? undefined : lastPageParam + GAMES_PAGE_SIZE,
  });
}