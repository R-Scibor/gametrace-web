import type { HeatmapCell } from '../../types/api';
import { formatDuration } from '../../lib/format';
import styles from './Heatmap.module.css';

const DAY_LABELS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nied'];

interface HeatmapProps {
  data: HeatmapCell[];
}

export function Heatmap({ data }: HeatmapProps) {
  const max = Math.max(...data.map((d) => d.seconds), 1);

  const cellMap = new Map<string, HeatmapCell>();
  for (const cell of data) {
    cellMap.set(`${cell.dow}-${cell.hour}`, cell);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.hourLabels}>
        <span />
        {Array.from({ length: 24 }, (_, h) => (
          <span key={h} className={styles.hourLabel}>
            {h % 6 === 0 ? `${h}` : ''}
          </span>
        ))}
      </div>
      {DAY_LABELS.map((dayLabel, dow) => (
        <div key={dayLabel} className={styles.row}>
          <span className={styles.dayLabel}>{dayLabel}</span>
          {Array.from({ length: 24 }, (_, hour) => {
            const cell = cellMap.get(`${dow}-${hour}`);
            const seconds = cell?.seconds ?? 0;
            const intensity = seconds / max;
            const opacity = seconds > 0 ? Math.max(0.25, intensity) : 0.08;
            const tooltip = `${dayLabel} ${hour}:00 — ${formatDuration(seconds)}`;

            return (
              <div
                key={hour}
                className={styles.cell}
                style={{ backgroundColor: `rgba(255, 122, 26, ${opacity})` }}
                title={tooltip}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}