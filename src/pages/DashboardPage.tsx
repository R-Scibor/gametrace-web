import { useDashboard } from '../hooks/useDashboard';
import { StatTile, ErrorBanner, Skeleton } from '../components/ui';
import { ActiveSessionCard } from '../components/dashboard/ActiveSessionCard';
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
    </div>
  );
}

export function DashboardPage() {
  const { formatHours, formatHeaderDate } = useFormat();
  const { data, isLoading, isError, refetch } = useDashboard();

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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>◈ GAMETRACE</span>
          <h1 className={styles.title}>Pulpit</h1>
        </div>
        <span className={styles.headerDate}>{formatHeaderDate()}</span>
      </header>

      <div className={styles.topRow}>
        {data.active_session ? (
          <ActiveSessionCard session={data.active_session} />
        ) : (
          <div className={styles.tilesOnly}>
            <StatTile label="DZIŚ" value={formatHours(data.total_seconds_today)} unit="h" />
            <StatTile label="7 DNI" value={formatHours(data.total_seconds_7d)} unit="h" />
            <StatTile label="30 DNI" value={formatHours(data.total_seconds_30d)} unit="h" />
          </div>
        )}
        {data.active_session && (
          <div className={styles.tiles}>
            <StatTile label="DZIŚ" value={formatHours(data.total_seconds_today)} unit="h" />
            <StatTile label="7 DNI" value={formatHours(data.total_seconds_7d)} unit="h" />
            <StatTile label="30 DNI" value={formatHours(data.total_seconds_30d)} unit="h" />
          </div>
        )}
      </div>
    </div>
  );
}