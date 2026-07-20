import { useQuery } from '@tanstack/react-query';
import { getAdminStatsOverview } from '../api/admin';
import { qk } from '../lib/queryKeys';

export function useAdminOverview() {
  return useQuery({
    queryKey: qk.adminOverview,
    queryFn: getAdminStatsOverview,
    staleTime: 30_000,
  });
}
