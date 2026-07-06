import { StatTile } from '../ui';
import { useFormat } from '../../hooks/useFormat';
import styles from './DashboardStatTiles.module.css';

interface DashboardStatTilesProps {
  todaySeconds: number;
  weekSeconds: number;
  avgSessionSeconds: number | null;
  avgLoading?: boolean;
  layout?: 'column' | 'row';
}

export function DashboardStatTiles({
  todaySeconds,
  weekSeconds,
  avgSessionSeconds,
  avgLoading = false,
  layout = 'column',
}: DashboardStatTilesProps) {
  const { formatHours } = useFormat();

  const avgValue =
    avgLoading || avgSessionSeconds == null ? '—' : formatHours(avgSessionSeconds);

  return (
    <div className={layout === 'row' ? styles.row : styles.column}>
      <StatTile label="DZIŚ" value={formatHours(todaySeconds)} unit="h" />
      <StatTile label="7 DNI" value={formatHours(weekSeconds)} unit="h" />
      <StatTile label="ŚR. SESJA" value={avgValue} unit={avgValue === '—' ? undefined : 'h'} />
    </div>
  );
}