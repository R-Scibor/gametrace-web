import { Skeleton } from '../../components/ui';
import { AttentionTile } from '../../components/admin/overview/AttentionTile';
import { StatTile } from '../../components/admin/overview/StatTile';
import { useAdminOverview } from '../../hooks/useAdminOverview';
import { formatHours } from '../../lib/format';
import styles from './AdminOverviewPage.module.css';

export function AdminOverviewPage() {
  const { data, isLoading, isError, refetch } = useAdminOverview();

  if (isLoading) {
    return (
      <div className={styles.grid}>
        <Skeleton height={78} />
        <Skeleton height={78} />
        <Skeleton height={78} />
        <Skeleton height={78} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={styles.state}>
        <p>Nie udało się wczytać przeglądu.</p>
        <button type="button" onClick={() => refetch()}>
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <section>
        <h2 className={styles.sectionLabel}>Homelab</h2>
        <div className={styles.grid}>
          <StatTile label="Użytkownicy" value={String(data.user_count)} />
          <StatTile label="Sesje" value={String(data.session_count)} />
          <StatTile label="Czas gry (h)" value={formatHours(data.total_seconds)} />
          <StatTile label="Gry" value={String(data.game_count)} />
        </div>
      </section>

      <section>
        <h2 className={styles.sectionLabel}>Wymaga uwagi</h2>
        <div className={styles.grid}>
          <AttentionTile
            label="Do sprawdzenia"
            value={data.needs_review_count}
            to="/admin/catalog?status=NEEDS_REVIEW"
          />
          <AttentionTile
            label="W kolejce"
            value={data.pending_enrichment_count}
            to="/admin/catalog?status=PENDING"
          />
          <AttentionTile
            label="Otwarte zgłoszenia"
            value={data.open_reports_count}
            to="/admin/reports?status=open"
          />
        </div>
      </section>
    </div>
  );
}
