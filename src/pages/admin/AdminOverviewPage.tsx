import { Button, ErrorBanner, Skeleton, StatTile } from '../../components/ui';
import { AttentionTile } from '../../components/admin/overview/AttentionTile';
import { useAdminOverview } from '../../hooks/useAdminOverview';
import { formatHours } from '../../lib/format';
import styles from './AdminOverviewPage.module.css';

export function AdminOverviewPage() {
  const { data, isLoading, isError, refetch } = useAdminOverview();

  if (isLoading) {
    // Mirrors the resolved layout: a section of four tiles, then one of three.
    return (
      <div className={styles.container}>
        <section>
          <h2 className={styles.sectionLabel}>Homelab</h2>
          <div className={styles.grid}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={78} />
            ))}
          </div>
        </section>
        <section>
          <h2 className={styles.sectionLabel}>Wymaga uwagi</h2>
          <div className={styles.grid}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={78} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={styles.state}>
        <ErrorBanner message="Nie udało się wczytać przeglądu." />
        <Button type="button" variant="secondary" onClick={() => refetch()}>
          Spróbuj ponownie
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <section>
        <h2 className={styles.sectionLabel}>Homelab</h2>
        <div className={styles.grid}>
          <StatTile label="Użytkownicy" value={data.user_count} />
          <StatTile label="Sesje" value={data.session_count} />
          <StatTile label="Czas gry" value={formatHours(data.total_seconds)} unit="h" />
          <StatTile label="Gry" value={data.game_count} />
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
