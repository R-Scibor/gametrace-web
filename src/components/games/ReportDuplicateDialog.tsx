import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMergeCandidates, useSubmitReport } from '../../hooks/useReports';
import {
  buildWebReportContext,
  composeMergeCandidateMessage,
  MERGE_NOTE_MAX,
} from '../../lib/mergeCandidateReport';
import { useToastStore } from '../../store/toastStore';
import { Button, Modal } from '../ui';
import type { Game } from '../../types/api';
import styles from './ReportDuplicateDialog.module.css';

interface ReportDuplicateDialogProps {
  open: boolean;
  onClose: () => void;
  source: { id: number; name: string };
}

/**
 * Sends a "these two games are the same" report to the admin panel
 * (POST /reports). It never merges anything itself — merging is admin-only.
 */
export function ReportDuplicateDialog({ open, onClose, source }: ReportDuplicateDialogProps) {
  const { t, i18n } = useTranslation('gameDetail');
  const pushToast = useToastStore((s) => s.pushToast);
  const uid = useId();
  const titleId = `${uid}-title`;
  const searchId = `${uid}-search`;
  const noteId = `${uid}-note`;

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Game | null>(null);
  const [note, setNote] = useState('');

  const candidates = useMergeCandidates(source.id, query, i18n.language, { enabled: open });
  const submit = useSubmitReport();

  const games = candidates.data ?? [];
  const loading = candidates.isFetching;
  const loadError = candidates.isError;
  const submitting = submit.isPending;

  const handleClose = () => {
    setQuery('');
    setSelected(null);
    setNote('');
    submit.reset();
    onClose();
  };

  const canSend = !!selected && selected.id !== source.id && !submitting;

  const handleSend = () => {
    if (!selected || !canSend) return;
    const message = composeMergeCandidateMessage({
      source,
      target: { id: selected.id, name: selected.primary_name },
      note,
    });
    submit.mutate(
      { message, context: buildWebReportContext('GameDetail') },
      {
        onSuccess: () => {
          handleClose();
          pushToast({ type: 'success', message: t('report.thanks') });
        },
      },
    );
  };

  return (
    <Modal open={open} onClose={handleClose} labelledBy={titleId} className={styles.dialog}>
      <h2 id={titleId} className={styles.title}>
        {t('report.title')}
      </h2>
      <p className={styles.explainer}>{t('report.explainer')}</p>

      <div>
        <p className={styles.fieldLabel}>{t('report.source')}</p>
        <p className={styles.sourceName}>{source.name.trim() || '—'}</p>
      </div>

      <div className={styles.field}>
        <label htmlFor={searchId} className={styles.fieldLabel}>
          {t('report.otherGame')}
        </label>
        <input
          id={searchId}
          type="search"
          className={styles.input}
          value={query}
          placeholder={t('report.searchPlaceholder')}
          autoComplete="off"
          onChange={(e) => setQuery(e.target.value)}
        />
        {selected && (
          <div className={styles.selectedChip}>
            <span className={styles.selectedName}>{selected.primary_name}</span>
            <button
              type="button"
              className={styles.clearSelection}
              aria-label={t('report.clearSelection')}
              onClick={() => setSelected(null)}
            >
              ✕
            </button>
          </div>
        )}
        {loadError ? (
          <div className={styles.status} role="alert">
            <span>{t('report.loadError')}</span>
            <button type="button" className={styles.retry} onClick={() => void candidates.refetch()}>
              {t('report.retry')}
            </button>
          </div>
        ) : loading && games.length === 0 ? (
          <p className={styles.status}>{t('report.loading')}</p>
        ) : games.length === 0 ? (
          <p className={styles.status}>
            {query.trim() ? t('report.noResults') : t('report.emptyList')}
          </p>
        ) : (
          <div
            className={styles.list}
            role="radiogroup"
            aria-label={t('report.otherGame')}
            aria-busy={loading || undefined}
          >
            {games.map((g) => (
              <label
                key={g.id}
                className={[styles.option, selected?.id === g.id ? styles.optionSelected : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                <input
                  type="radio"
                  name={`${uid}-candidate`}
                  className={styles.radio}
                  checked={selected?.id === g.id}
                  onChange={() => {
                    setSelected(g);
                    submit.reset();
                  }}
                />
                <span className={styles.optionName}>{g.primary_name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor={noteId} className={styles.fieldLabel}>
          {t('report.noteLabel')}
        </label>
        <textarea
          id={noteId}
          className={[styles.input, styles.note].join(' ')}
          value={note}
          maxLength={MERGE_NOTE_MAX}
          rows={3}
          placeholder={t('report.notePlaceholder')}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {submit.isError && (
        <p className={styles.error} role="alert">
          {t('report.submitError')}
        </p>
      )}

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={handleClose}>
          {t('report.cancel')}
        </Button>
        <Button type="button" disabled={!canSend} onClick={handleSend}>
          {submitting ? t('report.sending') : t('report.send')}
        </Button>
      </div>
    </Modal>
  );
}
