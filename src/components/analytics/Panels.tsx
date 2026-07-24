import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { libraryDrillUrl } from '../../lib/libraryParams';
import type { LibraryFilter } from '../../types/api';
import {
  useStatsSummary,
  useHeatmap,
  useTrend,
  useGenres,
  useThemes,
  useCompanies,
  useReleaseYears,
} from '../../hooks/useStats';
import type {
  GameStatEntry,
  HeatmapCell,
  TrendResponse,
  TrendGranularity,
  GenresResponse,
  ThemesResponse,
  CompaniesResponse,
  ReleaseYearsResponse,
} from '../../types/api';
import { Heatmap } from './Heatmap';
import { BarList } from '../charts/BarList';
import { GameRankingTable } from '../charts/GameRankingTable';
import { TrendChart } from '../charts/TrendChart';
import { formatDuration } from '../../lib/format';
import { ErrorBanner, Panel, Skeleton } from '../ui';
import panelStyles from './Panels.module.css';

function useLibraryDrill() {
  const navigate = useNavigate();
  return (type: LibraryFilter['type'], value: string) => {
    navigate(libraryDrillUrl(type, value));
  };
}

export function RankingPanel({
  days,
  className,
  sampleData,
}: {
  days: number;
  className?: string;
  sampleData?: GameStatEntry[];
}) {
  const { t } = useTranslation('analytics');
  const { data, isLoading, isError } = useStatsSummary(days, { enabled: sampleData == null });
  if (sampleData != null) {
    return (
      <Panel title={t('panels.ranking')} className={className}>
        <div className={panelStyles.rankScroll}>
          <GameRankingTable games={sampleData} disabled />
        </div>
      </Panel>
    );
  }
  if (isLoading) return <Panel title={t('panels.ranking')} className={className}><Skeleton height={200} /></Panel>;
  if (isError || !data) return <Panel title={t('panels.ranking')} className={className}><ErrorBanner /></Panel>;
  return (
    <Panel title={t('panels.ranking')} className={className}>
      <div className={panelStyles.rankScroll}>
        <GameRankingTable games={data.per_game} />
      </div>
    </Panel>
  );
}

export function HeatmapPanel({
  days,
  className,
  sampleData,
}: {
  days: number;
  className?: string;
  sampleData?: HeatmapCell[];
}) {
  const { t } = useTranslation('analytics');
  const { data, isLoading, isError } = useHeatmap(days, { enabled: sampleData == null });
  if (sampleData != null) {
    return (
      <Panel title={t('panels.heatmap')} className={className}>
        <Heatmap data={sampleData} />
      </Panel>
    );
  }
  if (isLoading) return <Panel title={t('panels.heatmap')} className={className}><Skeleton height={200} /></Panel>;
  if (isError || !data) return <Panel title={t('panels.heatmap')} className={className}><ErrorBanner /></Panel>;
  return (
    <Panel title={t('panels.heatmap')} className={className}>
      <Heatmap data={data.cells} />
    </Panel>
  );
}

function trendPanelTitle(granularity?: TrendGranularity): string {
  if (granularity === 'day') return i18n.t('analytics:panels.trendDaily');
  if (granularity === 'month') return i18n.t('analytics:panels.trendMonthly');
  return i18n.t('analytics:panels.trendWeekly');
}

function formatTrendLabel(bucketStart: string, granularity: TrendGranularity): string {
  if (granularity === 'month') return bucketStart.slice(0, 7);
  return bucketStart.slice(5, 10);
}

function trendChartData(trend: TrendResponse) {
  return trend.buckets.map((b) => ({
    label: formatTrendLabel(b.bucket_start, trend.granularity),
    value: Math.round((b.total_seconds / 3600) * 10) / 10,
  }));
}

export function TrendPanel({
  days,
  className,
  sampleData,
}: {
  days: number;
  className?: string;
  sampleData?: TrendResponse;
}) {
  const { t } = useTranslation('analytics');
  const { data, isLoading, isError } = useTrend(days, { enabled: sampleData == null });
  if (sampleData != null) {
    return (
      <Panel title={trendPanelTitle(sampleData.granularity)} className={className}>
        <TrendChart data={trendChartData(sampleData)} />
      </Panel>
    );
  }
  const title = trendPanelTitle(data?.granularity);
  if (isLoading) return <Panel title={t('panels.trend')} className={className}><Skeleton height={200} /></Panel>;
  if (isError || !data) return <Panel title={t('panels.trend')} className={className}><ErrorBanner /></Panel>;
  return (
    <Panel title={title} className={className}>
      <TrendChart data={trendChartData(data)} />
    </Panel>
  );
}

export function GenresPanel({
  days,
  className,
  sampleData,
}: {
  days: number;
  className?: string;
  sampleData?: GenresResponse;
}) {
  const { t } = useTranslation('analytics');
  const drill = useLibraryDrill();
  const { data: liveData, isLoading, isError } = useGenres(days, { enabled: sampleData == null });

  if (sampleData == null) {
    if (isLoading) return <Panel title={t('panels.genres')} className={className}><Skeleton height={200} /></Panel>;
    if (isError || !liveData) return <Panel title={t('panels.genres')} className={className}><ErrorBanner /></Panel>;
  }

  const data = sampleData ?? liveData!;
  const max = Math.max(...data.items.map((i) => i.total_seconds), 1);
  const items = data.items.map((i) => ({
    id: i.genre,
    label: i.genre,
    value: formatDuration(i.total_seconds),
    ratio: i.total_seconds / max,
  }));
  return (
    <Panel title={t('panels.genres')} eyebrow={t('panels.tagsEyebrow')} className={className}>
      <BarList items={items} onItemClick={sampleData == null ? (item) => drill('genre', item.label) : undefined} />
    </Panel>
  );
}

export function ThemesPanel({
  days,
  className,
  sampleData,
}: {
  days: number;
  className?: string;
  sampleData?: ThemesResponse;
}) {
  const { t } = useTranslation('analytics');
  const drill = useLibraryDrill();
  const { data: liveData, isLoading, isError } = useThemes(days, { enabled: sampleData == null });

  if (sampleData == null) {
    if (isLoading) return <Panel title={t('panels.themes')} className={className}><Skeleton height={200} /></Panel>;
    if (isError || !liveData) return <Panel title={t('panels.themes')} className={className}><ErrorBanner /></Panel>;
  }

  const data = sampleData ?? liveData!;
  const max = Math.max(...data.items.map((i) => i.total_seconds), 1);
  const items = data.items.map((i) => ({
    id: i.theme,
    label: i.theme,
    value: formatDuration(i.total_seconds),
    ratio: i.total_seconds / max,
  }));
  return (
    <Panel title={t('panels.themes')} eyebrow={t('panels.tagsEyebrow')} className={className}>
      <BarList items={items} onItemClick={sampleData == null ? (item) => drill('theme', item.label) : undefined} />
    </Panel>
  );
}

export function CompaniesPanel({
  days,
  className,
  sampleData,
}: {
  days: number;
  className?: string;
  sampleData?: { developer: CompaniesResponse; publisher: CompaniesResponse };
}) {
  const { t } = useTranslation('analytics');
  const drill = useLibraryDrill();
  const [role, setRole] = useState<'developer' | 'publisher'>('developer');
  const { data: liveData, isLoading, isError } = useCompanies(role, 10, days, { enabled: sampleData == null });

  const roleToggle = (
    <div className={panelStyles.roleToggle}>
      <button
        type="button"
        className={[panelStyles.roleBtn, role === 'developer' ? panelStyles.roleBtnActive : '']
          .filter(Boolean)
          .join(' ')}
        onClick={() => setRole('developer')}
      >
        {t('panels.developer')}
      </button>
      <button
        type="button"
        className={[panelStyles.roleBtn, role === 'publisher' ? panelStyles.roleBtnActive : '']
          .filter(Boolean)
          .join(' ')}
        onClick={() => setRole('publisher')}
      >
        {t('panels.publisher')}
      </button>
    </div>
  );

  if (sampleData == null) {
    if (isLoading) {
      return (
        <Panel title={t('panels.companies')} headerExtra={roleToggle} className={className}>
          <Skeleton height={200} />
        </Panel>
      );
    }
    if (isError || !liveData) {
      return (
        <Panel title={t('panels.companies')} headerExtra={roleToggle} className={className}>
          <ErrorBanner />
        </Panel>
      );
    }
  }

  const data = sampleData ? sampleData[role] : liveData!;
  const max = Math.max(...data.items.map((i) => i.total_seconds), 1);
  const items = data.items.map((i) => ({
    id: i.name,
    label: i.name,
    value: formatDuration(i.total_seconds),
    secondary: t('panels.gameCount', { count: i.game_count }),
    ratio: i.total_seconds / max,
  }));

  return (
    <Panel title={t('panels.companies')} headerExtra={roleToggle} className={className}>
      <BarList items={items} onItemClick={sampleData == null ? (item) => drill(role, item.label) : undefined} />
    </Panel>
  );
}

export function ReleaseYearsPanel({
  days,
  className,
  sampleData,
}: {
  days: number;
  className?: string;
  sampleData?: ReleaseYearsResponse;
}) {
  const { t } = useTranslation('analytics');
  const drill = useLibraryDrill();
  const { data: liveData, isLoading, isError } = useReleaseYears(days, { enabled: sampleData == null });

  if (sampleData == null) {
    if (isLoading) return <Panel title={t('panels.decades')} className={className}><Skeleton height={200} /></Panel>;
    if (isError || !liveData) return <Panel title={t('panels.decades')} className={className}><ErrorBanner /></Panel>;
  }

  const data = sampleData ?? liveData!;
  const max = Math.max(...data.items.map((i) => i.total_seconds), 1);
  const items = data.items.map((i) => ({
    id: i.decade,
    label: i.decade,
    value: formatDuration(i.total_seconds),
    ratio: i.total_seconds / max,
  }));
  return (
    <Panel title={t('panels.decades')} className={className}>
      <BarList items={items} onItemClick={sampleData == null ? (item) => drill('release_decade', item.label) : undefined} />
    </Panel>
  );
}