import { useTranslation } from 'react-i18next';
import { useFormat } from '../../hooks/useFormat';
import { EMPTY_VALUE } from '../../lib/format';
import { DurationValue } from '../ui';
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
  /** When set, the value renders as hours and minutes with small units. */
  seconds?: number;
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
  const { t } = useTranslation('dashboard');
  const { formatDurationOrZero } = useFormat();

  const avgReady = !avgLoading && avgSessionSeconds != null;
  const avgValue = avgReady ? formatDurationOrZero(avgSessionSeconds) : EMPTY_VALUE;
  const streakValue = streakDays == null ? EMPTY_VALUE : String(streakDays);

  const tiles: Tile[] = [
    {
      key: 'today',
      label: t('tiles.today'),
      value: formatDurationOrZero(todaySeconds),
      seconds: todaySeconds,
    },
    {
      key: 'week',
      label: t('tiles.week'),
      value: formatDurationOrZero(weekSeconds),
      seconds: weekSeconds,
    },
    {
      key: 'avg',
      label: t('tiles.avgSession'),
      value: avgValue,
      seconds: avgReady ? avgSessionSeconds : undefined,
    },
    {
      key: 'streak',
      label: t('tiles.streak'),
      value: streakValue,
      unit: streakValue === EMPTY_VALUE ? undefined : t('tiles.daysUnit'),
    },
  ];

  return (
    <div className={layout === 'row' ? styles.row : styles.rail}>
      {tiles.map((tile) => (
        <div key={tile.key} className={styles.tile}>
          <span className={styles.accent} aria-hidden />
          <span className={styles.label}>{tile.label}</span>
          <span
            className={[
              styles.value,
              tile.value === EMPTY_VALUE && styles.valueEmpty,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {tile.seconds != null ? (
              <DurationValue seconds={tile.seconds} unitClassName={styles.unit} />
            ) : (
              tile.value
            )}
            {tile.unit && <span className={styles.unit}>{tile.unit}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
