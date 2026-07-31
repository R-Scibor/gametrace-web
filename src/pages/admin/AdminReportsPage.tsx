import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MasterDetail } from '../../components/admin/MasterDetail';
import { ReportFilters, type ReportFilterChange } from '../../components/admin/reports/ReportFilters';
import { ReportInspector } from '../../components/admin/reports/ReportInspector';
import { ReportList } from '../../components/admin/reports/ReportList';
import { Button, EmptyState, ErrorBanner, Skeleton } from '../../components/ui';
import {
  useAdminReportFacets,
  useAdminReports,
  useDeleteAdminReport,
  usePatchAdminReport,
} from '../../hooks/useAdminReports';
import { parseIntParamOrNull } from '../../lib/urlParams';
import type { AdminReportPatch, ReportStatus } from '../../types/api';
import styles from './AdminReportsPage.module.css';

export function AdminReportsPage() {
  const { t } = useTranslation('admin');
  const [params, setParams] = useSearchParams();

  const status = (params.get('status') as ReportStatus | null) ?? 'open';
  const q = params.get('q') ?? '';
  const screen = params.get('screen') ?? '';
  const platform = params.get('platform') ?? '';
  const selectedId = parseIntParamOrNull(params, 'report');

  const { data, isLoading, isError, refetch } = useAdminReports({
    status,
    q: q || undefined,
    screen: screen || undefined,
    platform: platform || undefined,
  });
  const facetsQuery = useAdminReportFacets(status);
  const patch = usePatchAdminReport();
  const del = useDeleteAdminReport();

  const items = data?.items ?? [];
  const selected = items.find((r) => r.id === selectedId) ?? null;
  // Id-scoped: do not lock a newly selected row while a prior mutation is in flight.
  const isPending =
    (patch.isPending && patch.variables?.id === selected?.id) ||
    (del.isPending && del.variables === selected?.id);

  // Functional updater: debounced search must merge against the latest URL, not a
  // stale closure, or a late q= write can wipe screen/platform/status set mid-type.
  const patchParams = (
    next: Record<string, string | undefined>,
    options?: { replace?: boolean },
  ) => {
    setParams((prev) => {
      const draft = new URLSearchParams(prev);
      Object.entries(next).forEach(([key, value]) => {
        if (value === undefined || value === '') draft.delete(key);
        else draft.set(key, value);
      });
      return draft;
    }, options);
  };

  const handleFilterChange = (change: ReportFilterChange) => {
    const isSearch = 'q' in change;
    // Status change clears selection only (spec). Other filters stay in the URL.
    if ('status' in change && change.status) {
      patchParams({ status: change.status, report: undefined });
      return;
    }
    patchParams(
      {
        ...('q' in change ? { q: change.q || undefined } : {}),
        ...('screen' in change ? { screen: change.screen || undefined } : {}),
        ...('platform' in change ? { platform: change.platform || undefined } : {}),
      },
      { replace: isSearch },
    );
  };

  const clearSelection = () => patchParams({ report: undefined });

  const handlePatch = (body: AdminReportPatch) => {
    if (!selected) return;
    patch.mutate(
      { id: selected.id, ...body },
      {
        onSuccess: () => {
          // Row left the current status bucket: drop selection so inspector is not stale.
          if (body.status !== undefined && body.status !== status) {
            clearSelection();
          }
        },
      },
    );
  };

  const handleDelete = () => {
    if (!selected) return;
    const id = selected.id;
    del.mutate(id, {
      onSuccess: () => clearSelection(),
    });
  };

  return (
    <div className={styles.container}>
      <ReportFilters
        status={status}
        q={q}
        screen={screen}
        platform={platform}
        facets={facetsQuery.data}
        facetsLoading={facetsQuery.isLoading}
        onChange={handleFilterChange}
      />

      {isLoading && <Skeleton height={220} />}

      {isError && (
        <div className={styles.state}>
          <ErrorBanner message={t('reports.errorLoad')} />
          <Button type="button" variant="secondary" onClick={() => refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className={styles.state}>
          <EmptyState message={t('reports.empty')} />
        </div>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <MasterDetail
          list={
            <ReportList
              items={items}
              selectedId={selectedId}
              onSelect={(id) => patchParams({ report: String(id) })}
            />
          }
          inspector={
            <ReportInspector
              item={selected}
              onPatch={handlePatch}
              onDelete={handleDelete}
              isPending={isPending}
            />
          }
        />
      )}
    </div>
  );
}
