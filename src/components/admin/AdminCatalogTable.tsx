import { useEffect, useState } from 'react';
import { Cover } from '../Cover';
import { Button, Skeleton } from '../ui';
import type { AdminGameItem, AdminGamesQuery, EnrichmentStatus } from '../../types/api';
import { ADMIN_STATUS_LABELS, ADMIN_STATUS_OPTIONS } from './adminCatalogLabels';
import styles from './AdminCatalogTable.module.css';

interface AdminCatalogTableProps {
  filter: AdminGamesQuery;
  items: AdminGameItem[];
  total: number;
  isLoading: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onFilterChange: (patch: Partial<AdminGamesQuery>) => void;
}

export function AdminCatalogTable({
  filter,
  items,
  total,
  isLoading,
  selectedId,
  onSelect,
  onFilterChange,
}: AdminCatalogTableProps) {
  const [search, setSearch] = useState(filter.q ?? '');

  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({ q: search.trim() || undefined, skip: 0 });
    }, 300);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const skip = filter.skip ?? 0;
  const limit = filter.limit ?? 50;
  const status = filter.status ?? 'NEEDS_REVIEW';
  const pageEnd = Math.min(skip + items.length, total);
  const canPrev = skip > 0;
  const canNext = skip + limit < total;

  const emptyMessage =
    status === 'NEEDS_REVIEW' ? 'Brak gier do sprawdzenia.' : 'Brak gier dla wybranego filtra.';

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <label className={styles.filterLabel}>
          Status
          <select
            className={styles.select}
            value={status}
            onChange={(e) =>
              onFilterChange({ status: e.target.value as EnrichmentStatus, skip: 0 })
            }
            aria-label="Filtr statusu"
          >
            {ADMIN_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Szukaj..."
          className={styles.search}
          aria-label="Szukaj w katalogu"
        />
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thCover} scope="col" />
              <th scope="col">Nazwa</th>
              <th scope="col">Status</th>
              <th scope="col">Sesje</th>
              <th scope="col">Aliasy</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5}>
                  <Skeleton height={48} />
                </td>
              </tr>
            )}
            {!isLoading &&
              items.map((item) => (
                <tr key={item.id}>
                  <td className={styles.coverCell}>
                    <button
                      type="button"
                      className={[
                        styles.rowBtn,
                        selectedId === item.id ? styles.rowActive : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => onSelect(item.id)}
                    >
                      <Cover
                        gameId={item.id}
                        coverImageUrl={item.cover_image_url}
                        placeholderChar={item.primary_name}
                        className={styles.coverThumb}
                      />
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={[
                        styles.rowBtn,
                        styles.nameBtn,
                        selectedId === item.id ? styles.rowActive : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => onSelect(item.id)}
                    >
                      {item.primary_name}
                    </button>
                  </td>
                  <td>{ADMIN_STATUS_LABELS[item.enrichment_status]}</td>
                  <td>{item.session_count}</td>
                  <td>{item.aliases.length}</td>
                </tr>
              ))}
          </tbody>
        </table>
        {!isLoading && items.length === 0 && <p className={styles.empty}>{emptyMessage}</p>}
      </div>

      <div className={styles.pagination}>
        <span className={styles.pageInfo}>
          {total === 0 ? '0 z 0' : `${skip + 1}–${pageEnd} z ${total}`}
        </span>
        <div className={styles.pageActions}>
          <Button
            type="button"
            variant="secondary"
            disabled={!canPrev}
            onClick={() => onFilterChange({ skip: Math.max(0, skip - limit) })}
          >
            ←
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!canNext}
            onClick={() => onFilterChange({ skip: skip + limit })}
          >
            →
          </Button>
        </div>
      </div>
    </div>
  );
}