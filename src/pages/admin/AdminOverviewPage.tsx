import { useTranslation } from 'react-i18next';
import { Button, ErrorBanner, Skeleton, StatTile } from '../../components/ui';
import { AttentionTile } from '../../components/admin/overview/AttentionTile';
import { PreviewRow, QueuePreview } from '../../components/admin/overview/QueuePreview';
import { useAdminGames } from '../../hooks/useAdminCatalog';
import { useAdminOverview } from '../../hooks/useAdminOverview';
import { useAdminReports } from '../../hooks/useAdminReports';
import { formatHours, formatRecency } from '../../lib/format';
import { sessionsLabel } from '../../lib/pluralize';
import styles from './AdminOverviewPage.module.css';

const PREVIEW_LIMIT = 5;

export function AdminOverviewPage() {
  const { t } = useTranslation('admin');
  const { data, isLoading, isError, refetch } = useAdminOverview();

  const hasOpenReports = (data?.open_reports_count ?? 0) > 0;
  const hasReview = (data?.needs_review_count ?? 0) > 0;

  const reportsPreview = useAdminReports(
    { status: 'open', limit: PREVIEW_LIMIT },
    { enabled: !!data && hasOpenReports },
  );
  const reviewPreview = useAdminGames(
    { status: 'NEEDS_REVIEW', limit: PREVIEW_LIMIT, sort: 'sessions_desc' },
    { enabled: !!data && hasReview },
  );

  if (isLoading) {
    return (
      <div className={styles.container}>
        <section>
          <h2 className={styles.sectionLabel}>{t('overview.attention')}</h2>
          <div className={styles.attentionGrid}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={110} />
            ))}
          </div>
        </section>
        <section>
          <h2 className={styles.sectionLabel}>{t('overview.queue')}</h2>
          <div className={styles.previewGrid}>
            <Skeleton height={140} />
            <Skeleton height={140} />
          </div>
        </section>
        <section>
          <h2 className={styles.sectionLabel}>{t('overview.homelab')}</h2>
          <div className={styles.compactGrid}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={64} />
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

  const reportItems = reportsPreview.data?.items ?? [];
  const reviewItems = reviewPreview.data?.items ?? [];

  return (
    <div className={styles.container}>
      <section>
        <h2 className={styles.sectionLabel}>{t('overview.attention')}</h2>
        <div className={styles.attentionGrid}>
          <AttentionTile
            size="hero"
            label={t('overview.needsReview')}
            value={data.needs_review_count}
            to="/admin/catalog?status=NEEDS_REVIEW"
            idleMessage={t('overview.idle.needsReview')}
          />
          <AttentionTile
            size="hero"
            label={t('overview.pending')}
            value={data.pending_enrichment_count}
            to="/admin/catalog?status=PENDING"
            idleMessage={t('overview.idle.pending')}
          />
          <AttentionTile
            size="hero"
            label={t('overview.openReports')}
            value={data.open_reports_count}
            to="/admin/reports?status=open"
            idleMessage={t('overview.idle.openReports')}
          />
        </div>
      </section>

      <section>
        <h2 className={styles.sectionLabel}>{t('overview.queue')}</h2>
        <div className={styles.previewGrid}>
          <QueuePreview
            title={t('overview.reportsPreview')}
            to="/admin/reports?status=open"
            isLoading={hasOpenReports && reportsPreview.isLoading}
            isError={hasOpenReports && reportsPreview.isError}
            empty={!hasOpenReports || reportItems.length === 0}
            emptyMessage={t('overview.emptyReports')}
          >
            {reportItems.map((item) => (
              <PreviewRow
                key={item.id}
                to={`/admin/reports?status=open&report=${item.id}`}
                primary={item.message}
                secondary={`${item.username ?? item.user_id} · ${formatRecency(item.created_at)}`}
              />
            ))}
          </QueuePreview>

          <QueuePreview
            title={t('overview.reviewPreview')}
            to="/admin/catalog?status=NEEDS_REVIEW"
            isLoading={hasReview && reviewPreview.isLoading}
            isError={hasReview && reviewPreview.isError}
            empty={!hasReview || reviewItems.length === 0}
            emptyMessage={t('overview.emptyReview')}
          >
            {reviewItems.map((item) => (
              <PreviewRow
                key={item.id}
                to={`/admin/catalog?status=NEEDS_REVIEW&game=${item.id}`}
                primary={item.primary_name}
                secondary={`#${item.id} · ${sessionsLabel(item.session_count)}`}
              />
            ))}
          </QueuePreview>
        </div>
      </section>

      <section>
        <h2 className={styles.sectionLabel}>{t('overview.homelab')}</h2>
        <div className={styles.compactGrid}>
          <StatTile size="compact" label={t('overview.users')} value={data.user_count} />
          <StatTile size="compact" label={t('overview.sessions')} value={data.session_count} />
          <StatTile
            size="compact"
            label={t('overview.playtime')}
            value={formatHours(data.total_seconds)}
            unit="h"
          />
          <StatTile size="compact" label={t('overview.games')} value={data.game_count} />
        </div>
      </section>
    </div>
  );
}
