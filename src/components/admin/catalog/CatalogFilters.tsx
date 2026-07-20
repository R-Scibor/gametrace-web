import type { AdminCatalogSort, EnrichmentStatus } from '../../../types/api';
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

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Wszystkie' },
  { value: 'NEEDS_REVIEW', label: 'Do sprawdzenia' },
  { value: 'PENDING', label: 'Oczekuje' },
  { value: 'ENRICHED', label: 'Wzbogacona' },
];

const SORT_OPTIONS: { value: AdminCatalogSort; label: string }[] = [
  { value: 'sessions_desc', label: 'Najwięcej sesji' },
  { value: 'name_asc', label: 'Nazwa A-Z' },
  { value: 'id_asc', label: 'Najstarsze ID' },
];

export function CatalogFilters({ q, status, sort, onChange }: CatalogFiltersProps) {
  return (
    <div className={styles.filters}>
      <input
        className={styles.search}
        type="search"
        aria-label="Szukaj gry"
        placeholder="Szukaj nazwy lub aliasu"
        value={q}
        onChange={(e) => onChange({ q: e.target.value })}
      />

      <Select
        label="Status"
        value={status ?? ''}
        onChange={(e) =>
          onChange({ status: (e.target.value || undefined) as EnrichmentStatus | undefined })
        }
      >
        {STATUS_OPTIONS.map((opt) => (
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
