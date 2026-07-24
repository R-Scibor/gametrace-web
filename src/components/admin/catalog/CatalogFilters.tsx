import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdminCatalogSort, EnrichmentStatus } from '../../../types/api';
import { getEnrichmentStatusOptions } from '../../../lib/enrichmentStatus';
import i18n from '../../../i18n';
import { Input, Select } from '../../ui';
import styles from './CatalogFilters.module.css';

export interface CatalogFilterChange {
  q?: string;
  status?: EnrichmentStatus | undefined;
  sort?: AdminCatalogSort;
}

interface CatalogFiltersProps {
  q: string;
  status: EnrichmentStatus | undefined;
  sort: AdminCatalogSort;
  onChange: (patch: CatalogFilterChange) => void;
}

const SORT_KEYS: AdminCatalogSort[] = ['sessions_desc', 'name_asc', 'id_asc'];

function getSortOptions(): { value: AdminCatalogSort; label: string }[] {
  return SORT_KEYS.map((value) => ({
    value,
    label: i18n.t(`admin:catalog.sort.${value}`),
  }));
}

const SEARCH_DEBOUNCE_MS = 300;

export function CatalogFilters({ q, status, sort, onChange }: CatalogFiltersProps) {
  const { t } = useTranslation('admin');
  const [searchInput, setSearchInput] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);

  // Keep local input in sync when q changes from outside (e.g. cleared elsewhere).
  // This runs during render (the React-recommended pattern for adjusting state
  // to a prop change), not in an effect, so it doesn't trigger an extra render pass.
  if (q !== syncedQ) {
    setSyncedQ(q);
    setSearchInput(q);
  }

  useEffect(() => {
    if (searchInput === q) return;
    const timer = setTimeout(() => onChange({ q: searchInput }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  return (
    <div className={styles.filters}>
      <Input
        className={styles.search}
        type="search"
        aria-label={t('catalog.searchAria')}
        placeholder={t('catalog.searchPlaceholder')}
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />

      <Select
        label={t('common.status')}
        value={status ?? ''}
        onChange={(e) =>
          onChange({ status: (e.target.value || undefined) as EnrichmentStatus | undefined })
        }
      >
        {getEnrichmentStatusOptions().map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>

      <Select
        label={t('catalog.sortLabel')}
        value={sort}
        onChange={(e) => onChange({ sort: e.target.value as AdminCatalogSort })}
      >
        {getSortOptions().map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
