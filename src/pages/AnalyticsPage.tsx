import { useSearchParams } from 'react-router-dom';
import { PendingErrorsBanner } from '../components/dashboard/PendingErrorsBanner';
import { SampleDataBanner } from '../components/ui';
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
import { useAuthStore } from '../store/authStore';
import {
  SAMPLE_STATS_SUMMARY,
  SAMPLE_HEATMAP,
  SAMPLE_TREND,
  SAMPLE_GENRES,
  SAMPLE_THEMES,
  SAMPLE_RELEASE_YEARS,
  SAMPLE_COMPANIES_DEVELOPER,
  SAMPLE_COMPANIES_PUBLISHER,
} from '../lib/sampleData';
import { ANALYTICS_DAY_PRESETS, analyticsPeriodPillLabel, parseAnalyticsDays } from '../lib/analyticsDays';
import styles from './AnalyticsPage.module.css';

function periodContextLabel(days: number): string {
  return days === 0 ? 'CAŁY OKRES' : `OSTATNIE ${days} DNI`;
}

export function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const days = parseAnalyticsDays(searchParams.get('days'));
  const { data: summary } = useStatsSummary(days);
  const previewDismissed = useAuthStore((s) => s.previewDismissed);

  const pageIsEmpty = summary != null && summary.per_game.length === 0;
  const showPreview = pageIsEmpty && !previewDismissed;

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
      <div className={styles.ambient} aria-hidden />

      {showPreview && <SampleDataBanner />}

      <div className={styles.toolbar}>
        <span className={styles.statusLine}>
          <span className={styles.statusDot} aria-hidden />
          {periodContextLabel(days)}
        </span>
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
              disabled={showPreview}
              aria-disabled={showPreview}
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
        <StatsOverview
          days={days}
          className={styles.span6}
          sampleData={showPreview ? SAMPLE_STATS_SUMMARY : undefined}
        />

        <div className={styles.sectionLabel}>
          <span className={styles.sectionText}>Kiedy grasz</span>
          <span className={styles.sectionRule} />
        </div>

        <div className={styles.activityBlock}>
          <div className={styles.activityMain}>
            <HeatmapPanel days={days} sampleData={showPreview ? SAMPLE_HEATMAP.cells : undefined} />
            <TrendPanel days={days} sampleData={showPreview ? SAMPLE_TREND : undefined} />
          </div>
          <RankingPanel
            days={days}
            className={styles.activityRail}
            sampleData={showPreview ? SAMPLE_STATS_SUMMARY.per_game : undefined}
          />
        </div>

        <div className={styles.sectionLabel}>
          <span className={styles.sectionText}>Twój gust</span>
          <span className={styles.sectionRule} />
        </div>

        <GenresPanel days={days} className={styles.span2} sampleData={showPreview ? SAMPLE_GENRES : undefined} />
        <ThemesPanel days={days} className={styles.span2} sampleData={showPreview ? SAMPLE_THEMES : undefined} />
        <ReleaseYearsPanel
          days={days}
          className={styles.span2}
          sampleData={showPreview ? SAMPLE_RELEASE_YEARS : undefined}
        />

        <div className={styles.sectionLabel}>
          <span className={styles.sectionText}>Twórcy</span>
          <span className={styles.sectionRule} />
        </div>

        <CompaniesPanel
          days={days}
          className={styles.span6}
          sampleData={
            showPreview
              ? { developer: SAMPLE_COMPANIES_DEVELOPER, publisher: SAMPLE_COMPANIES_PUBLISHER }
              : undefined
          }
        />
      </div>
    </div>
  );
}
