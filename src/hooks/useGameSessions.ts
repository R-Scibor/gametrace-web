import { useQuery } from '@tanstack/react-query';
import { getGameSessions } from '../api/games';
import { qk } from '../lib/queryKeys';
import type { Session } from '../types/api';

const PAGE_SIZE = 100;

async function fetchAllGameSessions(gameId: number): Promise<Session[]> {
  const all: Session[] = [];
  while (true) {
    const page = await getGameSessions(gameId, all.length, PAGE_SIZE);
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return all;
}

export function useGameSessions(gameId: number) {
  return useQuery({
    queryKey: qk.gameSessions(gameId),
    queryFn: () => fetchAllGameSessions(gameId),
    enabled: !!gameId,
  });
}