import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdminGameItem } from '../../../types/api';
import { ENRICHMENT_STATUS_LABELS } from '../../../lib/enrichmentStatus';
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

export function CatalogTable({
  items,
  total,
  skip,
  limit,
  selectedId,
  onSelect,
  onPage,
}: CatalogTableProps) {
  const { t } = useTranslation('admin');
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
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">{t('catalog.columns.cover')}</th>
            <th scope="col">{t('catalog.columns.name')}</th>
            <th scope="col">{t('catalog.columns.id')}</th>
            <th scope="col">{t('catalog.columns.status')}</th>
            <th scope="col">{t('catalog.columns.sessions')}</th>
            <th scope="col">{t('catalog.columns.aliases')}</th>
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
              aria-current={item.id === selectedId ? 'true' : undefined}
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
              <td>{ENRICHMENT_STATUS_LABELS[item.enrichment_status] ?? item.enrichment_status}</td>
              <td>{item.session_count}</td>
              <td>{item.aliases.length}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {items.length === 0 && <EmptyState message={t('catalog.emptyFilter')} />}

      <div className={styles.pagination}>
        <Button
          type="button"
          variant="secondary"
          className={styles.pageButton}
          disabled={skip === 0}
          onClick={() => onPage(Math.max(0, skip - limit))}
        >
          {t('catalog.prevPage')}
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
          {t('catalog.nextPage')}
        </Button>
      </div>
    </div>
  );
}
