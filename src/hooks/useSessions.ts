import { useQuery } from '@tanstack/react-query';
import { listSessions } from '../api/sessions';
import { qk } from '../lib/queryKeys';

const RECENT_LIMIT = 5;

export function useRecentSessions(activeSessionId?: number | null) {
  return useQuery({
    queryKey: qk.sessions({ recent: true, activeSessionId: activeSessionId ?? null }),
    queryFn: () => listSessions({ status: ['COMPLETED', 'ERROR'], limit: RECENT_LIMIT }),
    refetchInterval: 30_000,
  });
}