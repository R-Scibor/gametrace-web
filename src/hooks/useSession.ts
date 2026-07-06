import { useQuery } from '@tanstack/react-query';
import { getSession } from '../api/sessions';
import { qk } from '../lib/queryKeys';

export function useSession(sessionId: number, enabled = true) {
  return useQuery({
    queryKey: qk.session(sessionId),
    queryFn: () => getSession(sessionId),
    enabled: enabled && !!sessionId,
  });
}