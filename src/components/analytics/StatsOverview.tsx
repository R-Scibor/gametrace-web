import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStatsSummary } from '../../hooks/useStats';
import type { StatsSummary } from '../../types/api';
import { Cover } from '../Cover';
import { ErrorBanner, Panel, Skeleton } from '../ui';
import {
  formatAnalyticsPeriodSubtitle,
  formatDuration,
  formatHours,
  formatPeriodDelta,
} from '../../lib/format';
import styles from './StatsOverview.module.css';

function longestSessionCover(summary: StatsSummary): string | null {
  if (summary.longest_session_game_id == null) return null;
  return summary.per_game.find((g) => g.game_id === summary.longest_session_game_id)?.cover_image_url ?? null;
}

interface StatsOverviewProps {
  days: number;
  className?: string;
  sampleData?: StatsSummary;
}

export function StatsOverview({ days, className, sampleData }: StatsOverviewProps) {
  const { t } = useTranslation('analytics');
  const { data: liveData, isLoading, isError } = useStatsSummary(days, { enabled: sampleData == null });

  if (sampleData == null) {
    if (isLoading) {
      return (
        <Panel title={t('overview.title')} className={className}>
          <Skeleton height={120} />
        </Panel>
      );
    }
    if (isError || !liveData) {
      return (
        <Panel title={t('overview.title')} className={className}>
          <ErrorBanner />
        </Panel>
      );
    }
  }

  const data = sampleData ?? liveData!;
  const delta = formatPeriodDelta(data.total_seconds, data.previous_total_seconds);
  const showRecord = data.longest_session_seconds > 0 && data.longest_session_game_id != null;
  const recordName = data.longest_session_game_name ?? t('overview.recordFallback');
  const recordAria = t('overview.recordAria', { name: recordName });

  const recordBody = (
    <>
      <div className={styles.recordCoverWrap}>
        <Cover
          gameId={data.longest_session_game_id!}
          coverImageUrl={longestSessionCover(data) ?? undefined}
          placeholderChar={data.longest_session_game_name ?? undefined}
          className={styles.recordCover}
        />
      </div>
      <div className={styles.recordMeta}>
        <span className={styles.recordLabel}>{t('overview.recordLabel')}</span>
        {data.longest_session_game_name && (
          <span className={styles.recordGame}>{data.longest_session_game_name}</span>
        )}
        <span className={styles.recordValue}>{formatHours(data.longest_session_seconds)} h</span>
      </div>
    </>
  );

  return (
    <Panel title={t('overview.title')} eyebrow={t('overview.eyebrow')} className={className}>
      <div className={showRecord ? styles.grid : styles.gridNoRecord}>
        <section className={styles.totalBlock} aria-label={t('overview.totalAria')}>
          <span className={styles.totalLabel}>{t('overview.total')}</span>
          <span className={styles.totalValue}>{formatDuration(data.total_seconds)}</span>
          <div className={styles.totalMeta}>
            {delta && <span className={styles.totalDelta}>{delta}</span>}
            <span className={styles.totalSubtitle}>{formatAnalyticsPeriodSubtitle(data.days)}</span>
          </div>
        </section>

        <div className={`${styles.tile} ${styles.avgTile}`}>
          <span className={styles.tileLabel}>{t('overview.avgSession')}</span>
          <span className={styles.tileValue}>
            {formatHours(data.avg_session_seconds)}
            <span className={styles.tileUnit}>h</span>
          </span>
        </div>

        <div className={`${styles.tile} ${styles.newTile}`}>
          <span className={styles.tileLabel}>{t('overview.newGames')}</span>
          <span className={styles.tileValue}>{data.new_games_count}</span>
        </div>

        {showRecord && sampleData == null && (
          <Link
            to={`/library/${data.longest_session_game_id}`}
            className={styles.recordCard}
            aria-label={recordAria}
          >
            {recordBody}
          </Link>
        )}
        {showRecord && sampleData != null && (
          <div className={styles.recordCard} aria-label={recordAria}>
            {recordBody}
          </div>
        )}
      </div>
    </Panel>
  );
}
