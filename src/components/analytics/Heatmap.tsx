import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { HeatmapCell } from '../../types/api';
import { formatDuration } from '../../lib/format';
import styles from './Heatmap.module.css';

interface HeatmapProps {
  data: HeatmapCell[];
}

interface Selected {
  dow: number;
  hour: number;
}

export function Heatmap({ data }: HeatmapProps) {
  const { t } = useTranslation('analytics');
  const [selected, setSelected] = useState<Selected | null>(null);
  const max = Math.max(...data.map((d) => d.seconds), 1);

  const dayLabels = t('heatmap.daysShort', { returnObjects: true }) as string[];
  const dayFull = t('heatmap.daysFull', { returnObjects: true }) as string[];

  const cellMap = new Map<string, HeatmapCell>();
  for (const cell of data) {
    cellMap.set(`${cell.dow}-${cell.hour}`, cell);
  }

  const selectedSeconds = selected
    ? cellMap.get(`${selected.dow}-${selected.hour}`)?.seconds ?? 0
    : 0;

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.hourLabels}>
          <span />
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className={styles.hourLabel}>
              {h % 6 === 0 ? `${h}` : ''}
            </span>
          ))}
        </div>
        {dayLabels.map((dayLabel, dow) => (
          <div key={dayLabel} className={styles.row}>
            <span className={styles.dayLabel}>{dayLabel}</span>
            {Array.from({ length: 24 }, (_, hour) => {
              const cell = cellMap.get(`${dow}-${hour}`);
              const seconds = cell?.seconds ?? 0;
              const intensity = seconds / max;
              const opacity = seconds > 0 ? Math.max(0.25, intensity) : 0.08;
              const tooltip = t('heatmap.tooltip', {
                day: dayLabel,
                hour,
                duration: formatDuration(seconds),
              });
              const isSelected = selected?.dow === dow && selected?.hour === hour;

              return (
                <button
                  type="button"
                  key={hour}
                  className={[styles.cell, isSelected ? styles.cellSelected : '']
                    .filter(Boolean)
                    .join(' ')}
                  style={{ backgroundColor: `rgba(255, 122, 26, ${opacity})` }}
                  title={tooltip}
                  aria-label={tooltip}
                  aria-pressed={isSelected}
                  onClick={() => setSelected({ dow, hour })}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className={styles.readout} data-active={selected ? 'true' : 'false'} aria-live="polite">
        {selected ? (
          <>
            <span
              className={styles.readoutSwatch}
              style={{
                backgroundColor: `rgba(255, 122, 26, ${
                  selectedSeconds > 0 ? Math.max(0.25, selectedSeconds / max) : 0.08
                })`,
              }}
              aria-hidden
            />
            <div className={styles.readoutText}>
              <span className={styles.readoutEyebrow}>{t('heatmap.selectedField')}</span>
              <span className={styles.readoutSlot}>
                {dayFull[selected.dow]} · {selected.hour}:00–{selected.hour + 1}:00
              </span>
            </div>
            <span className={styles.readoutValue}>
              {selectedSeconds > 0 ? formatDuration(selectedSeconds) : t('heatmap.noActivity')}
            </span>
          </>
        ) : (
          <span className={styles.readoutHint}>
            <span className={styles.readoutHintDot} aria-hidden />
            {t('heatmap.hint')}
          </span>
        )}
      </div>
    </div>
  );
}
