import { useInfiniteQuery } from '@tanstack/react-query';
import { getGameSessions } from '../api/games';
import { qk } from '../lib/queryKeys';

export const GAME_SESSIONS_PAGE_SIZE = 20;

export function useGameSessions(gameId: number) {
  return useInfiniteQuery({
    queryKey: [...qk.gameSessions(gameId), 'pages'] as const,
    queryFn: ({ pageParam }) => getGameSessions(gameId, pageParam, GAME_SESSIONS_PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _all, lastPageParam) =>
      lastPage.length < GAME_SESSIONS_PAGE_SIZE ? undefined : lastPageParam + GAME_SESSIONS_PAGE_SIZE,
    enabled: !!gameId,
  });
}