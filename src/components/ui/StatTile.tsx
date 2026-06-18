import styles from './StatTile.module.css';

export interface StatTileProps {
  label: string;
  value: string | number;
  unit?: string;
  className?: string;
}

export function StatTile({ label, value, unit, className }: StatTileProps) {
  return (
    <div className={[styles.container, className].filter(Boolean).join(' ')}>
      <div className={styles.bar} />
      <div className={styles.body}>
        <div className={styles.label}>{label}</div>
        <div className={styles.value}>
          {value}
          {unit && <span className={styles.unit}>{unit}</span>}
        </div>
      </div>
    </div>
  );
}
