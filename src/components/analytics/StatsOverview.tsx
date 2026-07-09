import { Link } from 'react-router-dom';
import { useStatsSummary, useStreak } from '../../hooks/useStats';
import type { StatsSummary } from '../../types/api';
import { Cover } from '../Cover';
import { ErrorBanner, Panel, Skeleton, StatTile } from '../ui';
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
}

export function StatsOverview({ days, className }: StatsOverviewProps) {
  const { data, isLoading, isError } = useStatsSummary(days);
  const { data: streak, isLoading: streakLoading, isError: streakError } = useStreak();

  if (isLoading) {
    return (
      <Panel title="Przegląd" className={className}>
        <Skeleton height={120} />
      </Panel>
    );
  }

  if (isError || !data) {
    return (
      <Panel title="Przegląd" className={className}>
        <ErrorBanner />
      </Panel>
    );
  }

  const delta = formatPeriodDelta(data.total_seconds, data.previous_total_seconds);
  const showRecord = data.longest_session_seconds > 0 && data.longest_session_game_id != null;

  return (
    <Panel title="Przegląd" eyebrow="podsumowanie okresu" className={className}>
      <div className={styles.grid}>
        <section className={styles.totalBlock} aria-label="Łączny czas">
          <span className={styles.totalLabel}>Łącznie</span>
          <span className={styles.totalValue}>{formatDuration(data.total_seconds)}</span>
          <div className={styles.totalMeta}>
            {delta && <span className={styles.totalDelta}>{delta}</span>}
            <span className={styles.totalSubtitle}>{formatAnalyticsPeriodSubtitle(days)}</span>
          </div>
        </section>

        <StatTile
          label="ŚR. SESJA"
          value={formatHours(data.avg_session_seconds)}
          unit="h"
          className={styles.tile}
        />

        <StatTile
          label="NOWE GRY"
          value={String(data.new_games_count)}
          className={styles.tile}
        />

        <section className={styles.streakBlock} aria-label="Passa">
          <span className={styles.streakLabel}>Passa</span>
          {streakLoading ? (
            <Skeleton height={48} />
          ) : streakError || !streak ? (
            <span className={styles.streakMuted}>—</span>
          ) : (
            <div className={styles.streakValues}>
              <div className={styles.streakItem}>
                <span className={styles.streakItemLabel}>Obecnie</span>
                <span className={`${styles.streakItemValue} ${styles.streakActive}`}>
                  {streak.current_streak}
                </span>
              </div>
              <div className={styles.streakItem}>
                <span className={styles.streakItemLabel}>Rekord</span>
                <span className={styles.streakItemValue}>{streak.longest_streak}</span>
              </div>
            </div>
          )}
        </section>

        {showRecord ? (
          <Link
            to={`/library/${data.longest_session_game_id}`}
            className={styles.recordCard}
            aria-label={`Rekord: ${data.longest_session_game_name ?? 'najdłuższa sesja'}`}
          >
            <Cover
              gameId={data.longest_session_game_id}
              coverImageUrl={longestSessionCover(data) ?? undefined}
              placeholderChar={data.longest_session_game_name ?? undefined}
              className={styles.recordCover}
            />
            <div className={styles.recordMeta}>
              <span className={styles.recordLabel}>Rekord · najdłuższa sesja</span>
              {data.longest_session_game_name && (
                <span className={styles.recordGame}>{data.longest_session_game_name}</span>
              )}
              <span className={styles.recordValue}>{formatHours(data.longest_session_seconds)} h</span>
            </div>
          </Link>
        ) : (
          <section className={styles.recordPlaceholder} aria-hidden="true" />
        )}
      </div>
    </Panel>
  );
}