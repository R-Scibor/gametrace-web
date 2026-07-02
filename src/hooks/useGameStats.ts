import { useQuery } from '@tanstack/react-query';
import { getGameStats } from '../api/games';
import { qk } from '../lib/queryKeys';

export function useGameStats(gameId: number) {
  return useQuery({
    queryKey: qk.gameStats(gameId),
    queryFn: () => getGameStats(gameId),
    enabled: !!gameId,
  });
}