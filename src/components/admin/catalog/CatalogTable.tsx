import type { KeyboardEvent } from 'react';
import type { AdminGameItem, EnrichmentStatus } from '../../../types/api';
import { Button, EmptyState } from '../../ui';
import styles from './CatalogTable.module.css';

interface CatalogTableProps {
  items: AdminGameItem[];
  total: number;
  skip: number;
  limit: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onPage: (nextSkip: number) => void;
}

const STATUS_LABELS: Record<EnrichmentStatus, string> = {
  NEEDS_REVIEW: 'Do sprawdzenia',
  PENDING: 'Oczekuje',
  ENRICHED: 'Wzbogacona',
};

export function CatalogTable({
  items,
  total,
  skip,
  limit,
  selectedId,
  onSelect,
  onPage,
}: CatalogTableProps) {
  const page = Math.floor(skip / limit) + 1;
  const pages = Math.max(1, Math.ceil(total / limit));

  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, id: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(id);
    }
  };

  return (
    <div className={styles.wrapper}>
      <table className={styles.table} role="grid">
        <thead>
          <tr>
            <th scope="col">Okładka</th>
            <th scope="col">Nazwa</th>
            <th scope="col">ID</th>
            <th scope="col">Status</th>
            <th scope="col">Sesje</th>
            <th scope="col">Aliasy</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              tabIndex={0}
              className={
                item.id === selectedId ? `${styles.row} ${styles.selected}` : styles.row
              }
              aria-selected={item.id === selectedId}
              onClick={() => onSelect(item.id)}
              onKeyDown={(event) => handleRowKeyDown(event, item.id)}
            >
              <td>
                {item.cover_image_url ? (
                  <img className={styles.cover} src={item.cover_image_url} alt="" />
                ) : (
                  <div className={styles.cover} />
                )}
              </td>
              <td>{item.primary_name}</td>
              <td>#{item.id}</td>
              <td>{STATUS_LABELS[item.enrichment_status] ?? item.enrichment_status}</td>
              <td>{item.session_count}</td>
              <td>{item.aliases.length}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {items.length === 0 && <EmptyState message="Brak gier dla wybranego filtra." />}

      <div className={styles.pagination}>
        <Button
          type="button"
          variant="secondary"
          className={styles.pageButton}
          disabled={skip === 0}
          onClick={() => onPage(Math.max(0, skip - limit))}
        >
          Poprzednia
        </Button>
        <span>
          {page} / {pages}
        </span>
        <Button
          type="button"
          variant="secondary"
          className={styles.pageButton}
          disabled={skip + limit >= total}
          onClick={() => onPage(skip + limit)}
        >
          Następna
        </Button>
      </div>
    </div>
  );
}
