import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminCatalogDetail } from '../components/admin/AdminCatalogDetail';
import { AdminCatalogTable } from '../components/admin/AdminCatalogTable';
import { useAdminGames } from '../hooks/useAdmin';
import type { AdminGamesQuery, EnrichmentStatus } from '../types/api';
import styles from './AdminCatalogPage.module.css';

const VALID_STATUSES: EnrichmentStatus[] = ['NEEDS_REVIEW', 'PENDING', 'ENRICHED'];

export function AdminCatalogPage() {
  const [searchParams] = useSearchParams();

  // The overview hub links here with ?status=, so honour it on mount. The rest
  // of this page's state stays local until the catalog rebuild replaces it.
  const requestedStatus = searchParams.get('status') as EnrichmentStatus | null;
  const initialStatus =
    requestedStatus && VALID_STATUSES.includes(requestedStatus)
      ? requestedStatus
      : 'NEEDS_REVIEW';

  const [filter, setFilter] = useState<AdminGamesQuery>({
    status: initialStatus,
    skip: 0,
    limit: 50,
    sort: 'sessions_desc',
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data, isLoading } = useAdminGames(filter);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const selected = items.find((g) => g.id === selectedId) ?? null;

  const handleFilterChange = (patch: Partial<AdminGamesQuery>) => {
    setFilter((prev) => ({ ...prev, ...patch }));
    if (patch.skip !== undefined || patch.status !== undefined || patch.q !== undefined) {
      setSelectedId(null);
    }
  };

  return (
    <div className={styles.container}>
      <p className={styles.intro}>Przegląd globalnego katalogu gier.</p>
      <AdminCatalogTable
        filter={filter}
        items={items}
        total={total}
        isLoading={isLoading}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onFilterChange={handleFilterChange}
      />
      {selected && <AdminCatalogDetail item={selected} />}
    </div>
  );
}