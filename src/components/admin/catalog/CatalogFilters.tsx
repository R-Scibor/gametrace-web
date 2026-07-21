import { useEffect, useState } from 'react';
import type { AdminCatalogSort, EnrichmentStatus } from '../../../types/api';
import { ENRICHMENT_STATUS_OPTIONS } from '../../../lib/enrichmentStatus';
import { Select } from '../../ui';
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

const SORT_OPTIONS: { value: AdminCatalogSort; label: string }[] = [
  { value: 'sessions_desc', label: 'Najwięcej sesji' },
  { value: 'name_asc', label: 'Nazwa A-Z' },
  { value: 'id_asc', label: 'Najstarsze ID' },
];

const SEARCH_DEBOUNCE_MS = 300;

export function CatalogFilters({ q, status, sort, onChange }: CatalogFiltersProps) {
  const [searchInput, setSearchInput] = useState(q);

  // Keep local input in sync when q changes from outside (e.g. cleared elsewhere).
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    if (searchInput === q) return;
    const timer = setTimeout(() => onChange({ q: searchInput }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  return (
    <div className={styles.filters}>
      <input
        className={styles.search}
        type="search"
        aria-label="Szukaj gry"
        placeholder="Szukaj nazwy lub aliasu"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />

      <Select
        label="Status"
        value={status ?? ''}
        onChange={(e) =>
          onChange({ status: (e.target.value || undefined) as EnrichmentStatus | undefined })
        }
      >
        {ENRICHMENT_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>

      <Select
        label="Sortowanie"
        value={sort}
        onChange={(e) => onChange({ sort: e.target.value as AdminCatalogSort })}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
