import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../../lib/format';
import { reportStatusLabel } from '../../../lib/reportStatus';
import type { AdminReportItem, AdminReportPatch, ReportStatus } from '../../../types/api';
import { Button, ConfirmDialog, EmptyState, Panel, SectionHeader } from '../../ui';
import styles from './ReportInspector.module.css';

interface ReportInspectorProps {
  item: AdminReportItem | null;
  onPatch: (body: AdminReportPatch) => void;
  onDelete: () => void;
  isPending: boolean;
}

function renderContextValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function statusActions(status: ReportStatus): { status: ReportStatus; labelKey: string }[] {
  if (status === 'open') {
    return [
      { status: 'triaged', labelKey: 'reports.markTriaged' },
      { status: 'closed', labelKey: 'reports.close' },
    ];
  }
  if (status === 'triaged') {
    return [
      { status: 'open', labelKey: 'reports.reopen' },
      { status: 'closed', labelKey: 'reports.close' },
    ];
  }
  return [
    { status: 'open', labelKey: 'reports.reopen' },
    { status: 'triaged', labelKey: 'reports.markTriaged' },
  ];
}

export function ReportInspector({ item, onPatch, onDelete, isPending }: ReportInspectorProps) {
  const { t } = useTranslation('admin');
  const [noteDraft, setNoteDraft] = useState('');
  const [syncedKey, setSyncedKey] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!item) {
    return <EmptyState message={t('reports.selectPrompt')} />;
  }

  const syncKey = `${item.id}:${item.admin_note ?? ''}`;
  if (syncKey !== syncedKey) {
    setSyncedKey(syncKey);
    setNoteDraft(item.admin_note ?? '');
  }

  const contextEntries = Object.entries(item.context ?? {});
  const actions = statusActions(item.status);

  const saveNote = () => {
    const trimmed = noteDraft.trim();
    onPatch({ admin_note: trimmed.length === 0 ? null : trimmed });
  };

  const clearNote = () => {
    setNoteDraft('');
    onPatch({ admin_note: null });
  };

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

      <section className={styles.noteSection}>
        <SectionHeader label={t('reports.noteLabel')} />
        <textarea
          className={styles.note}
          maxLength={4000}
          value={noteDraft}
          disabled={isPending}
          placeholder={t('reports.notePlaceholder')}
          onChange={(e) => setNoteDraft(e.target.value)}
        />
        <div className={styles.noteActions}>
          <Button type="button" variant="secondary" disabled={isPending} onClick={saveNote}>
            {t('reports.saveNote')}
          </Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={clearNote}>
            {t('reports.clearNote')}
          </Button>
        </div>
      </section>

      <div className={styles.actions}>
        {actions.map((a, i) => (
          <Button
            key={a.status}
            type="button"
            variant={i === 0 ? 'primary' : 'secondary'}
            disabled={isPending}
            onClick={() => onPatch({ status: a.status })}
          >
            {t(a.labelKey)}
          </Button>
        ))}
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() => setDeleteOpen(true)}
        >
          {t('reports.delete')}
        </Button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title={t('reports.deleteConfirmTitle')}
        message={t('reports.deleteConfirmMessage')}
        confirmLabel={t('reports.deleteConfirm')}
        variant="danger"
        loading={isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          onDelete();
          setDeleteOpen(false);
        }}
      />
    </Panel>
  );
}
