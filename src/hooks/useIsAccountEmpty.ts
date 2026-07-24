import { useDashboard } from './useDashboard';
import { useRecentSessions } from './useSessions';

export function useIsAccountEmpty(): { isEmpty: boolean; isLoading: boolean } {
  const { data, isLoading: dashLoading, isSuccess: dashSuccess } = useDashboard();
  const activeId = data?.active_session?.id ?? null;
  const { data: recents, isLoading: recentsLoading } = useRecentSessions(activeId);

  const isLoading = dashLoading || recentsLoading || !dashSuccess;
  const hasHero = !!data?.active_session || !!recents?.some((s) => s.status === 'COMPLETED');
  const isEmpty = !isLoading && !hasHero;

  return { isEmpty, isLoading };
}
