import { useDashboard } from '../hooks/useDashboard';
import { useRecentSessions } from '../hooks/useSessions';
import { useStatsSummary } from '../hooks/useStats';
import { useGameStats } from '../hooks/useGameStats';
import { SectionHeader, ErrorBanner, Skeleton } from '../components/ui';
import { ActiveSessionCard } from '../components/dashboard/ActiveSessionCard';
import { HeroSpotlight } from '../components/dashboard/HeroSpotlight';
import { DashboardStatTiles } from '../components/dashboard/DashboardStatTiles';
import { PendingErrorsBanner } from '../components/dashboard/PendingErrorsBanner';
import { RecentSessionsList } from '../components/dashboard/RecentSessionsList';
import { useFormat } from '../hooks/useFormat';
import styles from './DashboardPage.module.css';

function DashboardSkeleton() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Skeleton height={12} width={120} />
          <Skeleton height={28} width={160} style={{ marginTop: 8 }} />
        </div>
        <Skeleton height={12} width={80} />
      </div>
      <div className={styles.topRow}>
        <Skeleton height={140} />
        <div className={styles.tiles}>
          <Skeleton height={90} />
          <Skeleton height={90} />
          <Skeleton height={90} />
        </div>
      </div>
      <Skeleton height={16} width={180} />
      <Skeleton height={60} />
      <Skeleton height={60} />
    </div>
  );
}

export function DashboardPage() {
  const { formatHeaderDate } = useFormat();
  const { data, isLoading, isError, refetch } = useDashboard();
  const { data: weekStats, isLoading: weekStatsLoading } = useStatsSummary(7);
  const activeId = data?.active_session?.id ?? null;
  const { data: recents, isLoading: recentsLoading } = useRecentSessions(activeId);

  const lastPlayed = !data?.active_session
    ? recents?.find((s) => s.status === 'COMPLETED') ?? null
    : null;
  const { data: spotlightStats } = useGameStats(lastPlayed?.game_id ?? 0);

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <div className={styles.container}>
        <ErrorBanner message="Nie udało się pobrać danych pulpitu." />
        <button type="button" onClick={() => refetch()} className={styles.retry}>
          SPRÓBUJ PONOWNIE
        </button>
      </div>
    );
  }

  const hasHero = !!data.active_session || !!lastPlayed;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>◈ GAMETRACE</span>
        <span className={styles.headerDate}>{formatHeaderDate()}</span>
      </header>

      {data.pending_errors.length > 0 && (
        <PendingErrorsBanner errors={data.pending_errors} />
      )}

      <div className={styles.topRow}>
        {data.active_session ? (
          <ActiveSessionCard session={data.active_session} />
        ) : lastPlayed ? (
          <HeroSpotlight session={lastPlayed} stats={spotlightStats} />
        ) : null}

        {hasHero ? (
          <DashboardStatTiles
            todaySeconds={data.total_seconds_today}
            weekSeconds={data.total_seconds_7d}
            avgSessionSeconds={weekStats?.avg_session_seconds ?? null}
            avgLoading={weekStatsLoading}
          />
        ) : (
          <DashboardStatTiles
            todaySeconds={data.total_seconds_today}
            weekSeconds={data.total_seconds_7d}
            avgSessionSeconds={weekStats?.avg_session_seconds ?? null}
            avgLoading={weekStatsLoading}
            layout="row"
          />
        )}
      </div>

      <SectionHeader title="Ostatnie sesje" />
      <RecentSessionsList sessions={recents ?? []} loading={recentsLoading} />
    </div>
  );
}