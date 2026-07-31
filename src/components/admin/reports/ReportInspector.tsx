import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../../lib/format';
import { reportStatusLabel } from '../../../lib/reportStatus';
import type { AdminReportItem } from '../../../types/api';
import { Button, EmptyState, Panel, SectionHeader } from '../../ui';
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
    <Panel
      eyebrow={`#${item.id} · ${reportStatusLabel(item.status)} · ${formatDate(item.created_at)}`}
      title={item.username ?? item.user_id}
    >
      <p className={styles.message}>{item.message}</p>

      <section>
        <SectionHeader label={t('reports.diagnostics')} />
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
      </section>

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
    </Panel>
  );
}
