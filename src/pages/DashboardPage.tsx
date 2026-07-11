import { useDashboard } from '../hooks/useDashboard';
import { useRecentSessions } from '../hooks/useSessions';
import { useStatsSummary, useStreak } from '../hooks/useStats';
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
          <Skeleton height={12} width={200} style={{ marginTop: 8 }} />
        </div>
        <Skeleton height={12} width={80} />
      </div>
      <div className={styles.topRow}>
        <Skeleton height={188} />
        <div className={styles.tilesFallback}>
          <Skeleton height={88} />
          <Skeleton height={88} />
          <Skeleton height={88} />
          <Skeleton height={88} />
        </div>
      </div>
      <Skeleton height={16} width={180} />
      <Skeleton height={56} />
      <Skeleton height={56} />
    </div>
  );
}

export function DashboardPage() {
  const { formatHeaderDate, formatHours } = useFormat();
  const { data, isLoading, isError, refetch } = useDashboard();
  const { data: weekStats, isLoading: weekStatsLoading } = useStatsSummary(7);
  const { data: streak } = useStreak();
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
        <ErrorBanner message="Nie udało się pobrać danych panelu." />
        <button type="button" onClick={() => refetch()} className={styles.retry}>
          SPRÓBUJ PONOWNIE
        </button>
      </div>
    );
  }

  const isLive = !!data.active_session;
  const hasHero = isLive || !!lastPlayed;

  return (
    <div className={styles.container}>
      <div className={styles.ambient} aria-hidden />

      <header className={styles.header}>
        <div className={styles.headLeft}>
          <span className={styles.statusLine}>
            <span
              className={styles.statusDot}
              data-live={isLive ? 'true' : 'false'}
              aria-hidden
            />
            {isLive
              ? 'SYSTEM AKTYWNY · SESJA W TOKU'
              : 'SYSTEM GOTOWY · BRAK AKTYWNEJ SESJI'}
          </span>
        </div>
        <div className={styles.headRight}>
          <span className={styles.headDate}>{formatHeaderDate()}</span>
          <span className={styles.headMetric}>
            <span className={styles.headMetricLabel}>TEN TYDZIEŃ</span>
            <span className={styles.headMetricValue}>
              {formatHours(data.total_seconds_7d)}h
            </span>
          </span>
        </div>
      </header>

      {data.pending_errors.length > 0 && (
        <PendingErrorsBanner errors={data.pending_errors} />
      )}

      <div className={hasHero ? styles.topRow : styles.topRowIdle}>
        {data.active_session ? (
          <ActiveSessionCard session={data.active_session} />
        ) : lastPlayed ? (
          <HeroSpotlight session={lastPlayed} stats={spotlightStats} />
        ) : null}

        <DashboardStatTiles
          todaySeconds={data.total_seconds_today}
          weekSeconds={data.total_seconds_7d}
          avgSessionSeconds={weekStats?.avg_session_seconds ?? null}
          avgLoading={weekStatsLoading}
          streakDays={streak?.current_streak ?? null}
          layout={hasHero ? 'rail' : 'row'}
        />
      </div>

      <SectionHeader title="Ostatnie sesje" />
      <RecentSessionsList sessions={recents ?? []} loading={recentsLoading} />
    </div>
  );
}
