import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../../lib/format';
import type { AdminReportItem } from '../../../types/api';
import { Button, EmptyState } from '../../ui';
import styles from './ReportInspector.module.css';

interface ReportInspectorProps {
  item: AdminReportItem | null;
  onTriage: (status: 'triaged' | 'closed') => void;
  isPending: boolean;
}

function renderContextValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function ReportInspector({ item, onTriage, isPending }: ReportInspectorProps) {
  const { t } = useTranslation('admin');
  if (!item) {
    return <EmptyState message={t('reports.selectPrompt')} />;
  }

  const contextEntries = Object.entries(item.context ?? {});

  return (
    <div className={styles.panel}>
      <div>
        <p className={styles.label}>
          {item.username ?? item.user_id} · {formatDate(item.created_at)}
        </p>
        <p className={styles.message}>{item.message}</p>
      </div>

      <div>
        <p className={styles.label}>{t('reports.diagnostics')}</p>
        {contextEntries.length === 0 ? (
          <p className={styles.key}>{t('reports.noDiagnostics')}</p>
        ) : (
          <div className={styles.context}>
            {contextEntries.map(([key, value]) => (
              <Fragment key={key}>
                <span className={styles.key}>{key}</span>
                <span className={styles.value}>{renderContextValue(value)}</span>
              </Fragment>
            ))}
          </div>
        )}
      </div>

      {item.status === 'open' && (
        <div className={styles.actions}>
          <Button variant="primary" disabled={isPending} onClick={() => onTriage('triaged')}>
            {t('reports.markTriaged')}
          </Button>
          <Button variant="secondary" disabled={isPending} onClick={() => onTriage('closed')}>
            {t('reports.close')}
          </Button>
        </div>
      )}
    </div>
  );
}
