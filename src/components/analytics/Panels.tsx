import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { libraryDrillUrl } from '../../lib/libraryParams';
import type { LibraryFilter, StatsSummary } from '../../types/api';
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
import { Cover } from '../Cover';
import {
  formatAnalyticsPeriodSubtitle,
  formatDuration,
  formatHours,
  formatPeriodDelta,
} from '../../lib/format';
import { ErrorBanner, Panel, Skeleton } from '../ui';
import panelStyles from './Panels.module.css';

function useLibraryDrill() {
  const navigate = useNavigate();
  return (type: LibraryFilter['type'], value: string) => {
    navigate(libraryDrillUrl(type, value));
  };
}

function longestSessionCover(summary: StatsSummary): string | null {
  if (summary.longest_session_game_id == null) return null;
  return summary.per_game.find((g) => g.game_id === summary.longest_session_game_id)?.cover_image_url ?? null;
}

function TotalInsights({ data, days }: { data: StatsSummary; days: number }) {
  const delta = formatPeriodDelta(data.total_seconds, data.previous_total_seconds);
  const showRecord = data.longest_session_seconds > 0 && data.longest_session_game_id != null;

  return (
    <div className={panelStyles.totalStack}>
      <div className={panelStyles.bigNumber}>{formatDuration(data.total_seconds)}</div>
      <div className={panelStyles.totalMeta}>
        {delta && <span className={panelStyles.totalDelta}>{delta}</span>}
        <span className={panelStyles.totalSubtitle}>{formatAnalyticsPeriodSubtitle(days)}</span>
      </div>
      {showRecord && (
        <Link
          to={`/library/${data.longest_session_game_id}`}
          className={panelStyles.recordCard}
        >
          <Cover
            gameId={data.longest_session_game_id}
            coverImageUrl={longestSessionCover(data) ?? undefined}
            placeholderChar={data.longest_session_game_name ?? undefined}
            className={panelStyles.recordCover}
          />
          <div className={panelStyles.recordMeta}>
            <span className={panelStyles.recordLabel}>Rekord · najdłuższa sesja</span>
            {data.longest_session_game_name && (
              <span className={panelStyles.recordGame}>{data.longest_session_game_name}</span>
            )}
            <span className={panelStyles.recordValue}>
              {formatHours(data.longest_session_seconds)} h
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}

export function TotalPanel({ days, className }: { days: number; className?: string }) {
  const { data, isLoading, isError } = useStatsSummary(days);
  if (isLoading) return <Panel title="Łączny czas" className={className}><Skeleton height={40} /></Panel>;
  if (isError || !data) return <Panel title="Łączny czas" className={className}><ErrorBanner /></Panel>;
  return (
    <Panel title="Łączny czas" className={className}>
      <TotalInsights data={data} days={days} />
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
  const drill = useLibraryDrill();
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
      <BarList items={items} onItemClick={(item) => drill('genre', item.label)} />
    </Panel>
  );
}

export function ThemesPanel({ days, className }: { days: number; className?: string }) {
  const drill = useLibraryDrill();
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
      <BarList items={items} onItemClick={(item) => drill('theme', item.label)} />
    </Panel>
  );
}

export function CompaniesPanel({ days, className }: { days: number; className?: string }) {
  const drill = useLibraryDrill();
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
      <BarList items={items} onItemClick={(item) => drill(role, item.label)} />
    </Panel>
  );
}

export function ReleaseYearsPanel({ days, className }: { days: number; className?: string }) {
  const drill = useLibraryDrill();
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
      <BarList items={items} onItemClick={(item) => drill('release_decade', item.label)} />
    </Panel>
  );
}