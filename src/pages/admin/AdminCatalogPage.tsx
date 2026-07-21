import { useSearchParams } from 'react-router-dom';
import { MasterDetail } from '../../components/admin/MasterDetail';
import { CatalogFilters, type CatalogFilterChange } from '../../components/admin/catalog/CatalogFilters';
import { CatalogInspector } from '../../components/admin/catalog/CatalogInspector';
import { CatalogTable } from '../../components/admin/catalog/CatalogTable';
import { Button, EmptyState, ErrorBanner, Skeleton } from '../../components/ui';
import { useAdminGames } from '../../hooks/useAdminCatalog';
import type { AdminCatalogSort, EnrichmentStatus } from '../../types/api';
import styles from './AdminCatalogPage.module.css';

const LIMIT = 50;

export function AdminCatalogPage() {
  const [params, setParams] = useSearchParams();

  const q = params.get('q') ?? '';
  const status = (params.get('status') as EnrichmentStatus | null) ?? undefined;
  const sort = (params.get('sort') as AdminCatalogSort | null) ?? 'sessions_desc';
  const skip = Number(params.get('skip') ?? 0);
  const selectedId = params.get('game') ? Number(params.get('game')) : null;

  const { data, isLoading, isError, refetch } = useAdminGames({ q, status, sort, skip, limit: LIMIT });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const selected = items.find((g) => g.id === selectedId) ?? null;

  const patch = (next: Record<string, string | undefined>) => {
    const draft = new URLSearchParams(params);
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        draft.delete(key);
      } else {
        draft.set(key, value);
      }
    });
    setParams(draft);
  };

  const handleFilterChange = (change: CatalogFilterChange) => {
    patch({
      ...('q' in change ? { q: change.q } : {}),
      ...('status' in change ? { status: change.status } : {}),
      ...('sort' in change ? { sort: change.sort } : {}),
      skip: '0',
    });
  };

  return (
    <div className={styles.container}>
      <CatalogFilters q={q} status={status} sort={sort} onChange={handleFilterChange} />

      {isLoading && <Skeleton height={280} />}

      {isError && (
        <div className={styles.state}>
          <ErrorBanner message="Nie udało się wczytać katalogu." />
          <Button type="button" variant="secondary" onClick={() => refetch()}>
            Spróbuj ponownie
          </Button>
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <EmptyState message="Brak gier w tym widoku." />
      )}

      {!isLoading && !isError && items.length > 0 && (
        <MasterDetail
          list={
            <CatalogTable
              items={items}
              total={total}
              skip={skip}
              limit={LIMIT}
              selectedId={selectedId}
              onSelect={(id) => patch({ game: String(id) })}
              onPage={(nextSkip) => patch({ skip: String(nextSkip) })}
            />
          }
          inspector={
            <CatalogInspector
              item={selected}
              onMerged={(targetId) => patch({ game: String(targetId) })}
            />
          }
        />
      )}
    </div>
  );
}
