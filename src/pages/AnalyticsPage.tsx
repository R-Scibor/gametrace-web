import { useSearchParams } from 'react-router-dom';
import { PendingErrorsBanner } from '../components/dashboard/PendingErrorsBanner';
import { StatsOverview } from '../components/analytics/StatsOverview';
import {
  RankingPanel,
  HeatmapPanel,
  TrendPanel,
  GenresPanel,
  ThemesPanel,
  CompaniesPanel,
  ReleaseYearsPanel,
} from '../components/analytics/Panels';
import { useStatsSummary } from '../hooks/useStats';
import { ANALYTICS_DAY_PRESETS, analyticsPeriodPillLabel, parseAnalyticsDays } from '../lib/analyticsDays';
import styles from './AnalyticsPage.module.css';

export function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const days = parseAnalyticsDays(searchParams.get('days'));
  const { data: summary } = useStatsSummary(days);

  const setDays = (next: number) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set('days', String(next));
        return params;
      },
      { replace: true },
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.periodRow} role="group" aria-label="Okres">
          {ANALYTICS_DAY_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={[
                styles.periodPill,
                days === preset ? styles.periodPillActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-pressed={days === preset}
              onClick={() => setDays(preset)}
            >
              {analyticsPeriodPillLabel(preset)}
            </button>
          ))}
        </div>
      </div>

      {summary && summary.pending_errors.length > 0 && (
        <PendingErrorsBanner errors={summary.pending_errors} />
      )}

      <div className={styles.grid}>
        <StatsOverview days={days} className={styles.span6} />

        <div className={styles.sectionLabel}>Aktywność</div>

        <HeatmapPanel days={days} className={styles.span4} />
        <RankingPanel days={days} className={styles.span2} />
        <TrendPanel days={days} className={styles.span6} />

        <div className={styles.sectionLabel}>Tagi i wydawcy</div>

        <GenresPanel days={days} className={styles.span2} />
        <ThemesPanel days={days} className={styles.span2} />
        <ReleaseYearsPanel days={days} className={styles.span2} />
        <CompaniesPanel days={days} className={styles.span6} />
      </div>
    </div>
  );
}