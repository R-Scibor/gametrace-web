import { useSearchParams } from 'react-router-dom';
import { MasterDetail } from '../../components/admin/MasterDetail';
import { ReportInspector } from '../../components/admin/reports/ReportInspector';
import { ReportList } from '../../components/admin/reports/ReportList';
import { Button, EmptyState, ErrorBanner, Skeleton } from '../../components/ui';
import { useAdminReports, useTriageReport } from '../../hooks/useAdminReports';
import type { ReportStatus } from '../../types/api';
import styles from './AdminReportsPage.module.css';

const STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: 'open', label: 'Otwarte' },
  { value: 'triaged', label: 'Obsłużone' },
  { value: 'closed', label: 'Zamknięte' },
];

export function AdminReportsPage() {
  const [params, setParams] = useSearchParams();

  const status = (params.get('status') as ReportStatus | null) ?? 'open';
  const selectedId = params.get('report') ? Number(params.get('report')) : null;

  const { data, isLoading, isError, refetch } = useAdminReports({ status });
  const triage = useTriageReport();

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
    triage.mutate({ id: selected.id, status: next });
  };

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        <label htmlFor="report-status">Status</label>
        <select
          id="report-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ReportStatus)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <Skeleton height={220} />}

      {isError && (
        <div className={styles.state}>
          <ErrorBanner message="Nie udało się wczytać zgłoszeń." />
          <Button type="button" variant="secondary" onClick={() => refetch()}>
            Spróbuj ponownie
          </Button>
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className={styles.state}>
          <EmptyState message="Brak zgłoszeń w tym widoku." />
        </div>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <MasterDetail
          list={<ReportList items={items} selectedId={selectedId} onSelect={setSelected} />}
          inspector={
            <ReportInspector
              item={selected}
              onTriage={handleTriage}
              isPending={triage.isPending}
            />
          }
        />
      )}
    </div>
  );
}
