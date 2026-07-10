import { useState } from 'react';
import { AdminCatalogDetail } from '../components/admin/AdminCatalogDetail';
import { AdminCatalogTable } from '../components/admin/AdminCatalogTable';
import { AdminSubNav } from '../components/admin/AdminSubNav';
import { useAdminGames } from '../hooks/useAdmin';
import type { AdminGamesQuery } from '../types/api';
import styles from './AdminCatalogPage.module.css';

export function AdminCatalogPage() {
  const [filter, setFilter] = useState<AdminGamesQuery>({
    status: 'NEEDS_REVIEW',
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
      <AdminSubNav />
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