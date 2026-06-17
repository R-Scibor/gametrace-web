import { useQuery } from '@tanstack/react-query';
import { getHealth } from '../api/health';
import { qk } from '../lib/queryKeys';

export function useHealth() {
  return useQuery({
    queryKey: qk.health,
    queryFn: getHealth,
    refetchInterval: 60_000,
  });
}
