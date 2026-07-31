import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MasterDetail } from '../../components/admin/MasterDetail';
import { ReportInspector } from '../../components/admin/reports/ReportInspector';
import { ReportList } from '../../components/admin/reports/ReportList';
import { Button, EmptyState, ErrorBanner, Select, Skeleton } from '../../components/ui';
import { useAdminReports, usePatchAdminReport } from '../../hooks/useAdminReports';
import { parseIntParamOrNull } from '../../lib/urlParams';
import { getReportStatusOptions } from '../../lib/reportStatus';
import type { ReportStatus } from '../../types/api';
import styles from './AdminReportsPage.module.css';

export function AdminReportsPage() {
  const { t } = useTranslation('admin');
  const [params, setParams] = useSearchParams();

  const status = (params.get('status') as ReportStatus | null) ?? 'open';
  const selectedId = parseIntParamOrNull(params, 'report');

  const { data, isLoading, isError, refetch } = useAdminReports({ status });
  const patch = usePatchAdminReport();

  const items = data?.items ?? [];
  const selected = items.find((r) => r.id === selectedId) ?? null;

  const setStatus = (next: ReportStatus) => {
    const draft = new URLSearchParams(params);
    draft.set('status', next);
    // Selection is dropped only because the chosen report may not exist in the new bucket.
    draft.delete('report');
    setParams(draft);
  };

  const setSelected = (id: number) => {
    const draft = new URLSearchParams(params);
    draft.set('report', String(id));
    setParams(draft);
  };

  const handleTriage = (next: 'triaged' | 'closed') => {
    if (!selected) return;
    patch.mutate({ id: selected.id, status: next });
  };

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        <Select
          label={t('common.status')}
          value={status}
          onChange={(e) => setStatus(e.target.value as ReportStatus)}
        >
          {getReportStatusOptions().map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

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
          list={<ReportList items={items} selectedId={selectedId} onSelect={setSelected} />}
          inspector={
            <ReportInspector
              item={selected}
              onTriage={handleTriage}
              isPending={patch.isPending}
            />
          }
        />
      )}
    </div>
  );
}
