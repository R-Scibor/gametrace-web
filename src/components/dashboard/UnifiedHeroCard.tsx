import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Cover } from '../Cover';
import { LiveTimer } from '../LiveTimer';
import { useFormat } from '../../hooks/useFormat';
import { EMPTY_VALUE } from '../../lib/format';
import type { GameStats, Session, ActiveSessionBrief } from '../../types/api';
import styles from './UnifiedHeroCard.module.css';

export interface UnifiedHeroCardProps {
  mode: 'idle' | 'live';
  gameId: number;
  gameName: string;
  coverImageUrl?: string | null;
  /** Used when mode === 'idle' */
  idleSession?: Session | null;
  idleStats?: GameStats | null;
  /** Used when mode === 'live' */
  liveSession?: ActiveSessionBrief | null;
  disabled?: boolean;
}

export function UnifiedHeroCard({
  mode,
  gameId,
  gameName,
  coverImageUrl,
  idleSession,
  idleStats,
  liveSession,
  disabled,
}: UnifiedHeroCardProps) {
  const { t } = useTranslation('dashboard');
  const { formatDurationOrZero, formatRecency, formatTimeShort } = useFormat();
  const isLive = mode === 'live';

  // Stats calculation for idle mode
  const avgSeconds =
    idleStats && idleStats.session_count > 0
      ? idleStats.total_seconds / idleStats.session_count
      : null;
  const totalDuration = idleStats ? formatDurationOrZero(idleStats.total_seconds) : EMPTY_VALUE;
  const sessionCount = idleStats ? String(idleStats.session_count) : EMPTY_VALUE;
  const avgDuration = formatDurationOrZero(avgSeconds);

  const recency = idleSession
    ? formatRecency(idleSession.end_time ?? idleSession.start_time)
    : '';

  const body = (
    <>
      <div className={styles.coverWrap}>
        <Cover
          gameId={gameId}
          coverImageUrl={coverImageUrl}
          placeholderChar={gameName}
          className={styles.cover}
        />
      </div>

      <div className={styles.body}>
        {/* Row 1: Header Eyebrow + Recency / Live Indicator */}
        <div className={styles.headerRow}>
          <div className={styles.eyebrowWrap}>
            {isLive ? (
              <>
                <span className={styles.liveDot} aria-hidden />
                <span className={styles.eyebrowLive}>{t('active.label')}</span>
              </>
            ) : (
              <span className={styles.eyebrowIdle}>{t('hero.lastPlayed')}</span>
            )}
          </div>

          <div className={styles.headerRight}>
            {isLive ? (
              <span className={styles.liveBadge}>{t('active.live')}</span>
            ) : (
              <span className={styles.recency}>{recency}</span>
            )}
          </div>
        </div>

        {/* Row 2: Prominent Game Title */}
        <div className={styles.nameRow}>
          <h3 className={styles.name} title={gameName}>
            {gameName}
          </h3>
        </div>

        {/* Row 3: Prominent Primary Metric & Secondary Metrics */}
        <div className={styles.metricsRow}>
          {/* Left Column: Primary Big Metric */}
          <div className={styles.primaryMetric}>
            <span className={styles.metricLabel}>
              {isLive ? 'CZAS SESJI' : t('hero.total')}
            </span>
            <div className={styles.metricValueWrap}>
              {isLive && liveSession ? (
                <LiveTimer startIso={liveSession.start_time} className={styles.timer} />
              ) : (
                <div className={styles.hoursWrap}>
                  <span className={styles.hours}>{totalDuration}</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.metricsDivider} aria-hidden />

          {/* Right Column: Secondary Metrics (balanced in both modes) */}
          <div className={styles.secondaryMetrics}>
            {isLive && liveSession ? (
              <>
                <div className={styles.subStat}>
                  <span className={styles.subStatLabel}>ROZPOCZĘTO</span>
                  <span className={styles.subStatValue}>
                    {formatTimeShort(liveSession.start_time)}
                  </span>
                </div>
                <div className={styles.subStat}>
                  <span className={styles.subStatLabel}>NAWIGACJA</span>
                  <span className={styles.actionPrompt}>{t('active.details')}</span>
                </div>
              </>
            ) : (
              <>
                <div className={styles.subStat}>
                  <span className={styles.subStatLabel}>{t('hero.sessions')}</span>
                  <span className={styles.subStatValue}>{sessionCount}</span>
                </div>
                <div className={styles.subStat}>
                  <span className={styles.subStatLabel}>{t('hero.avgSession')}</span>
                  <span className={styles.subStatValue}>{avgDuration}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );

  if (disabled) {
    return (
      <div className={styles.card} data-live={isLive ? 'true' : 'false'}>
        {body}
      </div>
    );
  }

  return (
    <Link
      to={`/library/${gameId}`}
      className={styles.card}
      data-live={isLive ? 'true' : 'false'}
    >
      {body}
    </Link>
  );
}
