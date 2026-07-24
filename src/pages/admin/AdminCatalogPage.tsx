import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MasterDetail } from '../../components/admin/MasterDetail';
import { CatalogFilters, type CatalogFilterChange } from '../../components/admin/catalog/CatalogFilters';
import { CatalogInspector } from '../../components/admin/catalog/CatalogInspector';
import { CatalogTable } from '../../components/admin/catalog/CatalogTable';
import { Button, ErrorBanner, Skeleton } from '../../components/ui';
import { useAdminGames } from '../../hooks/useAdminCatalog';
import { parseIntParam, parseIntParamOrNull } from '../../lib/urlParams';
import type { AdminCatalogSort, EnrichmentStatus } from '../../types/api';
import styles from './AdminCatalogPage.module.css';

const LIMIT = 50;

export function AdminCatalogPage() {
  const { t } = useTranslation('admin');
  const [params, setParams] = useSearchParams();

  const q = params.get('q') ?? '';
  const status = (params.get('status') as EnrichmentStatus | null) ?? undefined;
  const sort = (params.get('sort') as AdminCatalogSort | null) ?? 'sessions_desc';
  const skip = parseIntParam(params, 'skip', 0);
  const selectedId = parseIntParamOrNull(params, 'game');

  const { data, isLoading, isError, refetch } = useAdminGames({ q, status, sort, skip, limit: LIMIT });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const selected = items.find((g) => g.id === selectedId) ?? null;

  const patch = (next: Record<string, string | undefined>, options?: { replace?: boolean }) => {
    const draft = new URLSearchParams(params);
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        draft.delete(key);
      } else {
        draft.set(key, value);
      }
    });
    setParams(draft, options);
  };

  const handleFilterChange = (change: CatalogFilterChange) => {
    // Free-text search fires on every keystroke; replace so typing doesn't
    // flood the history stack. Discrete selections (status, sort) stay as
    // pushes so the back button can step through them meaningfully.
    const isSearch = 'q' in change;
    patch(
      {
        ...('q' in change ? { q: change.q } : {}),
        ...('status' in change ? { status: change.status } : {}),
        ...('sort' in change ? { sort: change.sort } : {}),
        skip: '0',
      },
      { replace: isSearch },
    );
  };

  return (
    <div className={styles.container}>
      <MasterDetail
        toolbar={
          <CatalogFilters q={q} status={status} sort={sort} onChange={handleFilterChange} />
        }
        list={
          <div className={styles.listCol}>
            {isLoading && <Skeleton height={280} />}

            {isError && (
              <div className={styles.state}>
                <ErrorBanner message={t('catalog.errorLoad')} />
                <Button type="button" variant="secondary" onClick={() => refetch()}>
                  {t('common.retry')}
                </Button>
              </div>
            )}

            {/*
              Rendered even with zero rows: CatalogTable owns the empty state so its
              pagination controls stay mounted. A filter that collapses the result set
              would otherwise strand the admin on an out-of-range skip.
            */}
            {!isLoading && !isError && (
              <CatalogTable
                items={items}
                total={total}
                skip={skip}
                limit={LIMIT}
                selectedId={selectedId}
                onSelect={(id) => patch({ game: String(id) })}
                onPage={(nextSkip) => patch({ skip: String(nextSkip) })}
              />
            )}
          </div>
        }
        inspector={
          isLoading || isError ? null : (
            <CatalogInspector
              item={selected}
              missingId={selectedId !== null && !selected ? selectedId : null}
              onShowAll={() => patch({ status: undefined, q: undefined, skip: '0' })}
              onMerged={(targetId) => patch({ game: String(targetId) })}
            />
          )
        }
      />
    </div>
  );
}
