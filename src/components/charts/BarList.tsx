import styles from './BarList.module.css';

interface BarListItem {
  id: string;
  label: string;
  value: string;
  ratio: number;
  secondary?: string;
}

interface BarListProps {
  items: BarListItem[];
  onItemClick?: (item: BarListItem) => void;
}

function BarRow({
  item,
  onItemClick,
}: {
  item: BarListItem;
  onItemClick?: (item: BarListItem) => void;
}) {
  const content = (
    <>
      <div className={styles.info}>
        <span className={styles.label}>{item.label}</span>
        <span className={styles.value}>
          {item.value}{' '}
          {item.secondary && <span className={styles.secondary}>({item.secondary})</span>}
        </span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${Math.max(item.ratio * 100, 1)}%` }} />
      </div>
    </>
  );

  if (onItemClick) {
    return (
      <button type="button" className={styles.rowButton} onClick={() => onItemClick(item)}>
        {content}
      </button>
    );
  }

  return <div className={styles.row}>{content}</div>;
}

export function BarList({ items, onItemClick }: BarListProps) {
  if (items.length === 0) return <p className={styles.empty}>Brak danych.</p>;

  return (
    <div className={styles.list}>
      {items.map((item) => (
        <BarRow key={item.id} item={item} onItemClick={onItemClick} />
      ))}
    </div>
  );
}