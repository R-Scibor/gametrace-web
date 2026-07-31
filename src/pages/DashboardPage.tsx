import { useTranslation } from 'react-i18next';
import { useDashboard } from '../hooks/useDashboard';
import { useRecentSessions } from '../hooks/useSessions';
import { useStatsSummary, useStreak } from '../hooks/useStats';
import { useGameStats } from '../hooks/useGameStats';
import { SectionHeader, ErrorBanner, Skeleton, SampleDataBanner } from '../components/ui';
import { ActiveSessionCard } from '../components/dashboard/ActiveSessionCard';
import { HeroSpotlight } from '../components/dashboard/HeroSpotlight';
import { DashboardStatTiles } from '../components/dashboard/DashboardStatTiles';
import { PendingErrorsBanner } from '../components/dashboard/PendingErrorsBanner';
import { RecentSessionsList } from '../components/dashboard/RecentSessionsList';
import { useAuthStore } from '../store/authStore';
import {
  SAMPLE_DASHBOARD,
  SAMPLE_STATS_SUMMARY,
  SAMPLE_STREAK,
  SAMPLE_LAST_SESSION,
  SAMPLE_GAME_STATS,
  SAMPLE_SESSIONS,
} from '../lib/sampleData';
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
  const { t } = useTranslation('dashboard');
  const { formatHeaderDate, formatHours } = useFormat();
  const { data, isLoading, isError, refetch } = useDashboard();
  const { data: weekStats, isLoading: weekStatsLoading } = useStatsSummary(7);
  const { data: streak } = useStreak();
  const activeId = data?.active_session?.id ?? null;
  const { data: recents, isLoading: recentsLoading } = useRecentSessions(activeId);
  const previewDismissed = useAuthStore((s) => s.previewDismissed);
  const setPreviewDismissed = useAuthStore((s) => s.setPreviewDismissed);

  const lastPlayed = !data?.active_session
    ? recents?.find((s) => s.status === 'COMPLETED') ?? null
    : null;
  const { data: spotlightStats } = useGameStats(lastPlayed?.game_id ?? 0);
  const sampleSpotlightStats = SAMPLE_GAME_STATS(SAMPLE_LAST_SESSION.game_id);

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <div className={styles.container}>
        <ErrorBanner message={t('error.load')} />
        <button type="button" onClick={() => refetch()} className={styles.retry}>
          {t('error.retry')}
        </button>
      </div>
    );
  }

  const isLive = !!data.active_session;
  const hasHero = isLive || !!lastPlayed;
  const pageIsEmpty = !isLive && !hasHero && !recentsLoading && (recents?.length ?? 0) === 0;
  const showPreview = pageIsEmpty && !previewDismissed;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headLeft}>
          <span className={styles.statusLine}>
            <span
              className={styles.statusDot}
              data-live={isLive ? 'true' : 'false'}
              aria-hidden
            />
            {isLive ? t('status.active') : t('status.idle')}
          </span>
        </div>
        <div className={styles.headRight}>
          <span className={styles.headDate}>{formatHeaderDate()}</span>
          <span className={styles.headMetric}>
            <span className={styles.headMetricLabel}>{t('header.thisWeek')}</span>
            <span className={styles.headMetricValue}>
              {formatHours(showPreview ? SAMPLE_DASHBOARD.total_seconds_7d : data.total_seconds_7d)}h
            </span>
          </span>
        </div>
      </header>

      {showPreview && <SampleDataBanner onDismiss={() => setPreviewDismissed(true)} />}

      {data.pending_errors.length > 0 && (
        <PendingErrorsBanner errors={data.pending_errors} />
      )}

      <div className={hasHero || showPreview ? styles.topRow : styles.topRowIdle}>
        {showPreview ? (
          <HeroSpotlight session={SAMPLE_LAST_SESSION} stats={sampleSpotlightStats} disabled />
        ) : data.active_session ? (
          <ActiveSessionCard session={data.active_session} />
        ) : lastPlayed ? (
          <HeroSpotlight session={lastPlayed} stats={spotlightStats} />
        ) : null}

        <DashboardStatTiles
          todaySeconds={showPreview ? SAMPLE_DASHBOARD.total_seconds_today : data.total_seconds_today}
          weekSeconds={showPreview ? SAMPLE_DASHBOARD.total_seconds_7d : data.total_seconds_7d}
          avgSessionSeconds={showPreview ? SAMPLE_STATS_SUMMARY.avg_session_seconds : (weekStats?.avg_session_seconds ?? null)}
          avgLoading={showPreview ? false : weekStatsLoading}
          streakDays={showPreview ? SAMPLE_STREAK.current_streak : (streak?.current_streak ?? null)}
          layout={hasHero || showPreview ? 'rail' : 'row'}
        />
      </div>

      <SectionHeader title={t('recentSessions')} />
      {showPreview ? (
        <RecentSessionsList sessions={SAMPLE_SESSIONS.slice(0, 8)} disabled />
      ) : (
        <RecentSessionsList sessions={recents ?? []} loading={recentsLoading} />
      )}
    </div>
  );
}
