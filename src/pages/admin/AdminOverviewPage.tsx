import { useTranslation } from 'react-i18next';
import { Button, ErrorBanner, Skeleton, StatTile } from '../../components/ui';
import { AttentionTile } from '../../components/admin/overview/AttentionTile';
import { useAdminOverview } from '../../hooks/useAdminOverview';
import { formatHours } from '../../lib/format';
import styles from './AdminOverviewPage.module.css';

export function AdminOverviewPage() {
  const { t } = useTranslation('admin');
  const { data, isLoading, isError, refetch } = useAdminOverview();

  if (isLoading) {
    // Mirrors the resolved layout: a section of four tiles, then one of three.
    return (
      <div className={styles.container}>
        <section>
          <h2 className={styles.sectionLabel}>{t('overview.homelab')}</h2>
          <div className={styles.grid}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={78} />
            ))}
          </div>
        </section>
        <section>
          <h2 className={styles.sectionLabel}>{t('overview.attention')}</h2>
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
        <ErrorBanner message={t('overview.errorLoad')} />
        <Button type="button" variant="secondary" onClick={() => refetch()}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <section>
        <h2 className={styles.sectionLabel}>{t('overview.homelab')}</h2>
        <div className={styles.grid}>
          <StatTile label={t('overview.users')} value={data.user_count} />
          <StatTile label={t('overview.sessions')} value={data.session_count} />
          <StatTile label={t('overview.playtime')} value={formatHours(data.total_seconds)} unit="h" />
          <StatTile label={t('overview.games')} value={data.game_count} />
        </div>
      </section>

      <section>
        <h2 className={styles.sectionLabel}>{t('overview.attention')}</h2>
        <div className={styles.grid}>
          <AttentionTile
            label={t('overview.needsReview')}
            value={data.needs_review_count}
            to="/admin/catalog?status=NEEDS_REVIEW"
          />
          <AttentionTile
            label={t('overview.pending')}
            value={data.pending_enrichment_count}
            to="/admin/catalog?status=PENDING"
          />
          <AttentionTile
            label={t('overview.openReports')}
            value={data.open_reports_count}
            to="/admin/reports?status=open"
          />
        </div>
      </section>
    </div>
  );
}
