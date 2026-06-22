import { useSearchParams } from 'react-router-dom';
import { Select } from '../components/ui/Select';
import { PendingErrorsBanner } from '../components/dashboard/PendingErrorsBanner';
import {
  TotalPanel,
  RankingPanel,
  HeatmapPanel,
  StreakPanel,
  WeeklyTrendPanel,
  GenresPanel,
  ThemesPanel,
  CompaniesPanel,
  ReleaseYearsPanel,
} from '../components/analytics/Panels';
import { useStatsSummary } from '../hooks/useStats';
import { ANALYTICS_DAY_PRESETS, parseAnalyticsDays } from '../lib/analyticsDays';
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
        <h1 className={styles.pageTitle}>Statystyki</h1>
        <Select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Okres">
          {ANALYTICS_DAY_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              Ostatnie {preset} dni
            </option>
          ))}
        </Select>
      </div>

      {summary && summary.pending_errors.length > 0 && (
        <PendingErrorsBanner errors={summary.pending_errors} />
      )}

      <div className={styles.grid}>
        <TotalPanel days={days} className={styles.span3} />
        <StreakPanel className={styles.span3} />
        <HeatmapPanel days={days} className={styles.span6} />
        <RankingPanel days={days} className={styles.span6} />
        <WeeklyTrendPanel weeks={12} className={styles.span6} />
        <GenresPanel className={styles.span3} />
        <ThemesPanel className={styles.span3} />
        <CompaniesPanel className={styles.span6} />
        <ReleaseYearsPanel className={styles.span6} />
      </div>
    </div>
  );
}