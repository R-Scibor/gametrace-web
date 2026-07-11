import { useFormat } from '../../hooks/useFormat';
import styles from './DashboardStatTiles.module.css';

interface DashboardStatTilesProps {
  todaySeconds: number;
  weekSeconds: number;
  avgSessionSeconds: number | null;
  avgLoading?: boolean;
  streakDays?: number | null;
  layout?: 'rail' | 'row';
}

interface Tile {
  label: string;
  value: string;
  unit?: string;
  key: string;
}

export function DashboardStatTiles({
  todaySeconds,
  weekSeconds,
  avgSessionSeconds,
  avgLoading = false,
  streakDays = null,
  layout = 'rail',
}: DashboardStatTilesProps) {
  const { formatHours } = useFormat();

  const avgValue =
    avgLoading || avgSessionSeconds == null ? '—' : formatHours(avgSessionSeconds);
  const streakValue = streakDays == null ? '—' : String(streakDays);

  const tiles: Tile[] = [
    { key: 'today', label: 'DZIŚ', value: formatHours(todaySeconds), unit: 'h' },
    { key: 'week', label: '7 DNI', value: formatHours(weekSeconds), unit: 'h' },
    {
      key: 'avg',
      label: 'ŚR. SESJA',
      value: avgValue,
      unit: avgValue === '—' ? undefined : 'h',
    },
    {
      key: 'streak',
      label: 'PASSA',
      value: streakValue,
      unit: streakValue === '—' ? undefined : 'dni',
    },
  ];

  return (
    <div className={layout === 'row' ? styles.row : styles.rail}>
      {tiles.map((tile) => (
        <div key={tile.key} className={styles.tile}>
          <span className={styles.accent} aria-hidden />
          <span className={styles.label}>{tile.label}</span>
          <span className={styles.value}>
            {tile.value}
            {tile.unit && <span className={styles.unit}>{tile.unit}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
