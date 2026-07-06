import { useState } from 'react';
import {
  useStatsSummary,
  useHeatmap,
  useStreak,
  useTrend,
  useGenres,
  useThemes,
  useCompanies,
  useReleaseYears,
} from '../../hooks/useStats';
import type { TrendGranularity } from '../../types/api';
import { Heatmap } from './Heatmap';
import { BarList } from '../charts/BarList';
import { GameRankingTable } from '../charts/GameRankingTable';
import { TrendChart } from '../charts/TrendChart';
import { formatDuration } from '../../lib/format';
import { ErrorBanner, Panel, Skeleton } from '../ui';
import panelStyles from './Panels.module.css';

export function TotalPanel({ days, className }: { days: number; className?: string }) {
  const { data, isLoading, isError } = useStatsSummary(days);
  if (isLoading) return <Panel title="Łączny czas" className={className}><Skeleton height={40} /></Panel>;
  if (isError || !data) return <Panel title="Łączny czas" className={className}><ErrorBanner /></Panel>;
  return (
    <Panel title="Łączny czas" className={className}>
      <div className={panelStyles.bigNumber}>{formatDuration(data.total_seconds)}</div>
    </Panel>
  );
}

export function RankingPanel({ days, className }: { days: number; className?: string }) {
  const { data, isLoading, isError } = useStatsSummary(days);
  if (isLoading) return <Panel title="Ranking gier" className={className}><Skeleton height={200} /></Panel>;
  if (isError || !data) return <Panel title="Ranking gier" className={className}><ErrorBanner /></Panel>;
  return (
    <Panel title="Ranking gier" className={className}>
      <GameRankingTable games={data.per_game} />
    </Panel>
  );
}

export function HeatmapPanel({ days, className }: { days: number; className?: string }) {
  const { data, isLoading, isError } = useHeatmap(days);
  if (isLoading) return <Panel title="Mapa aktywności" className={className}><Skeleton height={200} /></Panel>;
  if (isError || !data) return <Panel title="Mapa aktywności" className={className}><ErrorBanner /></Panel>;
  return (
    <Panel title="Mapa aktywności" className={className}>
      <Heatmap data={data.cells} />
    </Panel>
  );
}

export function StreakPanel({ className }: { className?: string }) {
  const { data, isLoading, isError } = useStreak();
  if (isLoading) return <Panel title="Passa" className={className}><Skeleton height={40} /></Panel>;
  if (isError || !data) return <Panel title="Passa" className={className}><ErrorBanner /></Panel>;
  return (
    <Panel title="Passa" className={className}>
      <div className={panelStyles.streakRow}>
        <div className={panelStyles.streakBlock}>
          <span className={panelStyles.streakLabel}>Obecnie</span>
          <span className={`${panelStyles.streakValue} ${panelStyles.streakValueActive}`}>
            {data.current_streak}
          </span>
        </div>
        <div className={panelStyles.streakBlock}>
          <span className={panelStyles.streakLabel}>Rekord</span>
          <span className={panelStyles.streakValue}>{data.longest_streak}</span>
        </div>
      </div>
    </Panel>
  );
}

function trendPanelTitle(granularity?: TrendGranularity): string {
  if (granularity === 'day') return 'Trend dzienny';
  if (granularity === 'month') return 'Trend miesięczny';
  return 'Trend tygodniowy';
}

function formatTrendLabel(bucketStart: string, granularity: TrendGranularity): string {
  if (granularity === 'month') return bucketStart.slice(0, 7);
  return bucketStart.slice(5, 10);
}

export function TrendPanel({ days, className }: { days: number; className?: string }) {
  const { data, isLoading, isError } = useTrend(days);
  const title = trendPanelTitle(data?.granularity);
  if (isLoading) return <Panel title="Trend" className={className}><Skeleton height={200} /></Panel>;
  if (isError || !data) return <Panel title="Trend" className={className}><ErrorBanner /></Panel>;
  const chartData = data.buckets.map((b) => ({
    label: formatTrendLabel(b.bucket_start, data.granularity),
    value: Math.round((b.total_seconds / 3600) * 10) / 10,
  }));
  return (
    <Panel title={title} className={className}>
      <TrendChart data={chartData} />
    </Panel>
  );
}

export function GenresPanel({ days, className }: { days: number; className?: string }) {
  const { data, isLoading, isError } = useGenres(days);
  if (isLoading) return <Panel title="Gatunki" className={className}><Skeleton height={200} /></Panel>;
  if (isError || !data) return <Panel title="Gatunki" className={className}><ErrorBanner /></Panel>;
  const max = Math.max(...data.items.map((i) => i.total_seconds), 1);
  const items = data.items.map((i) => ({
    id: i.genre,
    label: i.genre,
    value: formatDuration(i.total_seconds),
    ratio: i.total_seconds / max,
  }));
  return (
    <Panel title="Gatunki" eyebrow="ekspozycja tagów, nie podział" className={className}>
      <BarList items={items} />
    </Panel>
  );
}

export function ThemesPanel({ days, className }: { days: number; className?: string }) {
  const { data, isLoading, isError } = useThemes(days);
  if (isLoading) return <Panel title="Motywy" className={className}><Skeleton height={200} /></Panel>;
  if (isError || !data) return <Panel title="Motywy" className={className}><ErrorBanner /></Panel>;
  const max = Math.max(...data.items.map((i) => i.total_seconds), 1);
  const items = data.items.map((i) => ({
    id: i.theme,
    label: i.theme,
    value: formatDuration(i.total_seconds),
    ratio: i.total_seconds / max,
  }));
  return (
    <Panel title="Motywy" eyebrow="ekspozycja tagów, nie podział" className={className}>
      <BarList items={items} />
    </Panel>
  );
}

export function CompaniesPanel({ days, className }: { days: number; className?: string }) {
  const [role, setRole] = useState<'developer' | 'publisher'>('developer');
  const { data, isLoading, isError } = useCompanies(role, 10, days);

  const roleToggle = (
    <div className={panelStyles.roleToggle}>
      <button
        type="button"
        className={[panelStyles.roleBtn, role === 'developer' ? panelStyles.roleBtnActive : '']
          .filter(Boolean)
          .join(' ')}
        onClick={() => setRole('developer')}
      >
        TWÓRCA
      </button>
      <button
        type="button"
        className={[panelStyles.roleBtn, role === 'publisher' ? panelStyles.roleBtnActive : '']
          .filter(Boolean)
          .join(' ')}
        onClick={() => setRole('publisher')}
      >
        WYDAWCA
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <Panel title="Studia / Wydawcy" headerExtra={roleToggle} className={className}>
        <Skeleton height={200} />
      </Panel>
    );
  }
  if (isError || !data) {
    return (
      <Panel title="Studia / Wydawcy" headerExtra={roleToggle} className={className}>
        <ErrorBanner />
      </Panel>
    );
  }

  const max = Math.max(...data.items.map((i) => i.total_seconds), 1);
  const items = data.items.map((i) => ({
    id: i.name,
    label: i.name,
    value: formatDuration(i.total_seconds),
    secondary: `${i.game_count} gier`,
    ratio: i.total_seconds / max,
  }));

  return (
    <Panel title="Studia / Wydawcy" headerExtra={roleToggle} className={className}>
      <BarList items={items} />
    </Panel>
  );
}

export function ReleaseYearsPanel({ days, className }: { days: number; className?: string }) {
  const { data, isLoading, isError } = useReleaseYears(days);
  if (isLoading) return <Panel title="Dekady premier" className={className}><Skeleton height={200} /></Panel>;
  if (isError || !data) return <Panel title="Dekady premier" className={className}><ErrorBanner /></Panel>;
  const max = Math.max(...data.items.map((i) => i.total_seconds), 1);
  const items = data.items.map((i) => ({
    id: i.decade,
    label: i.decade,
    value: formatDuration(i.total_seconds),
    ratio: i.total_seconds / max,
  }));
  return (
    <Panel title="Dekady premier" className={className}>
      <BarList items={items} />
    </Panel>
  );
}