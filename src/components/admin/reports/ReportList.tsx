import { formatRecency } from '../../../lib/format';
import { REPORT_STATUS_LABELS } from '../../../lib/reportStatus';
import type { AdminReportItem } from '../../../types/api';
import styles from './ReportList.module.css';

interface ReportListProps {
  items: AdminReportItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function ReportList({ items, selectedId, onSelect }: ReportListProps) {
  return (
    <div className={styles.list}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={item.id === selectedId ? `${styles.row} ${styles.selected}` : styles.row}
          aria-current={item.id === selectedId}
          onClick={() => onSelect(item.id)}
        >
          <span className={styles.message}>{item.message}</span>
          <span className={styles.meta}>
            {item.username ?? item.user_id} · {formatRecency(item.created_at)} ·{' '}
            {REPORT_STATUS_LABELS[item.status]}
          </span>
        </button>
      ))}
    </div>
  );
}
