import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '../api/stats';
import { qk } from '../lib/queryKeys';

export function useDashboard() {
  return useQuery({
    queryKey: qk.dashboard,
    queryFn: getDashboardSummary,
    refetchInterval: 30_000,
  });
}
