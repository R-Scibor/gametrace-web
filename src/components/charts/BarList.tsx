import styles from './BarList.module.css';

interface BarListItem {
  id: string;
  label: string;
  value: string;
  ratio: number;
  secondary?: string;
}

export function BarList({ items }: { items: BarListItem[] }) {
  if (items.length === 0) return <p className={styles.empty}>Brak danych.</p>;

  return (
    <div className={styles.list}>
      {items.map(item => (
        <div key={item.id} className={styles.row}>
          <div className={styles.info}>
            <span className={styles.label}>{item.label}</span>
            <span className={styles.value}>
              {item.value} {item.secondary && <span className={styles.secondary}>({item.secondary})</span>}
            </span>
          </div>
          <div className={styles.track}>
            <div className={styles.fill} style={{ width: `${Math.max(item.ratio * 100, 1)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
