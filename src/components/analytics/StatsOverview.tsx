import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStatsSummary } from '../../hooks/useStats';
import type { StatsSummary } from '../../types/api';
import { Cover } from '../Cover';
import { ErrorBanner, Skeleton } from '../ui';
import {
  formatAnalyticsPeriodSubtitle,
  formatDuration,
  formatHours,
  formatPeriodDelta,
} from '../../lib/format';
import styles from './StatsOverview.module.css';

function longestSessionCover(summary: StatsSummary): string | null {
  if (summary.longest_session_game_id == null) return null;
  return (
    summary.per_game.find((g) => g.game_id === summary.longest_session_game_id)?.cover_image_url ??
    null
  );
}

interface StatsOverviewProps {
  days: number;
  className?: string;
  sampleData?: StatsSummary;
}

export function StatsOverview({ days, className, sampleData }: StatsOverviewProps) {
  const { t } = useTranslation('analytics');
  const { data: liveData, isLoading, isError } = useStatsSummary(days, {
    enabled: sampleData == null,
  });

  const rootClass = [styles.root, className].filter(Boolean).join(' ');

  const heading = (
    <div className={styles.sectionLabel}>
      <span className={styles.sectionText}>{t('overview.title')}</span>
      <span className={styles.sectionRule} aria-hidden />
    </div>
  );

  if (sampleData == null) {
    if (isLoading) {
      return (
        <div className={rootClass}>
          {heading}
          <div className={styles.row}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={88} />
            ))}
          </div>
        </div>
      );
    }
    if (isError || !liveData) {
      return (
        <div className={rootClass}>
          {heading}
          <ErrorBanner />
        </div>
      );
    }
  }

  const data = sampleData ?? liveData!;
  const delta = formatPeriodDelta(data.total_seconds, data.previous_total_seconds);
  const showRecord = data.longest_session_seconds > 0 && data.longest_session_game_id != null;
  const recordName = data.longest_session_game_name ?? t('overview.recordFallback');
  const recordAria = t('overview.recordAria', { name: recordName });

  return (
    <div className={rootClass}>
      {heading}

      <div className={showRecord ? styles.row : styles.rowThree}>
        <section className={styles.tile} aria-label={t('overview.totalAria')}>
          <span className={styles.accent} aria-hidden />
          <span className={styles.label}>{t('overview.total')}</span>
          <div className={styles.valueStack}>
            <span className={styles.value}>{formatDuration(data.total_seconds)}</span>
            <span className={styles.meta}>
              {delta && <span className={styles.delta}>{delta}</span>}
              <span className={styles.subtitle}>{formatAnalyticsPeriodSubtitle(data.days)}</span>
            </span>
          </div>
        </section>

        <div className={styles.tile}>
          <span className={styles.accent} aria-hidden />
          <span className={styles.label}>{t('overview.avgSession')}</span>
          <span className={styles.value}>
            {formatHours(data.avg_session_seconds)}
            <span className={styles.unit}>h</span>
          </span>
        </div>

        <div className={styles.tile}>
          <span className={styles.accent} aria-hidden />
          <span className={styles.label}>{t('overview.newGames')}</span>
          <span className={styles.value}>{data.new_games_count}</span>
        </div>

        {showRecord && sampleData == null && (
          <Link
            to={`/library/${data.longest_session_game_id}`}
            className={`${styles.tile} ${styles.recordTile}`}
            aria-label={recordAria}
          >
            <span className={styles.accent} aria-hidden />
            <div className={styles.recordCoverWrap}>
              <Cover
                gameId={data.longest_session_game_id!}
                coverImageUrl={longestSessionCover(data) ?? undefined}
                placeholderChar={data.longest_session_game_name ?? undefined}
                className={styles.recordCover}
              />
            </div>
            <div className={styles.recordBody}>
              <span className={styles.label}>{t('overview.recordLabel')}</span>
              {data.longest_session_game_name && (
                <span className={styles.recordGame}>{data.longest_session_game_name}</span>
              )}
              <span className={styles.value}>
                {formatHours(data.longest_session_seconds)}
                <span className={styles.unit}>h</span>
              </span>
            </div>
          </Link>
        )}

        {showRecord && sampleData != null && (
          <div className={`${styles.tile} ${styles.recordTile}`} aria-label={recordAria}>
            <span className={styles.accent} aria-hidden />
            <div className={styles.recordCoverWrap}>
              <Cover
                gameId={data.longest_session_game_id!}
                coverImageUrl={longestSessionCover(data) ?? undefined}
                placeholderChar={data.longest_session_game_name ?? undefined}
                className={styles.recordCover}
              />
            </div>
            <div className={styles.recordBody}>
              <span className={styles.label}>{t('overview.recordLabel')}</span>
              {data.longest_session_game_name && (
                <span className={styles.recordGame}>{data.longest_session_game_name}</span>
              )}
              <span className={styles.value}>
                {formatHours(data.longest_session_seconds)}
                <span className={styles.unit}>h</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
