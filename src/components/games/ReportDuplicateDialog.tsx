import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getGames } from '../../api/games';
import { submitReport } from '../../api/reports';
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

const SEARCH_DEBOUNCE_MS = 300;

/** Library + catalog-only games (mobile does the same dual fetch), minus the source game. */
async function fetchCandidates(sourceId: number, locale: string, q?: string): Promise<Game[]> {
  const base = { limit: 100, sort: 'name' as const, ...(q ? { q } : {}) };
  const [inLib, outLib] = await Promise.all([
    getGames(base),
    getGames({ ...base, inLibrary: false }),
  ]);
  const byId = new Map<number, Game>();
  for (const g of [...inLib.items, ...outLib.items]) byId.set(g.id, g);
  byId.delete(sourceId);
  return Array.from(byId.values()).sort((a, b) =>
    a.primary_name.localeCompare(b.primary_name, locale),
  );
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
  const [games, setGames] = useState<Game[]>([]);
  const [selected, setSelected] = useState<Game | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(
    async (q: string) => {
      const id = ++requestId.current;
      setLoading(true);
      setLoadError(false);
      try {
        const list = await fetchCandidates(source.id, i18n.language, q || undefined);
        if (id === requestId.current) setGames(list);
      } catch {
        if (id === requestId.current) setLoadError(true);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [source.id, i18n.language],
  );

  // Initial load when opened, debounced reload while typing.
  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    const timer = setTimeout(() => void load(trimmed), trimmed ? SEARCH_DEBOUNCE_MS : 0);
    return () => clearTimeout(timer);
  }, [open, query, load]);

  const reset = () => {
    requestId.current += 1;
    setQuery('');
    setGames([]);
    setSelected(null);
    setNote('');
    setLoading(false);
    setLoadError(false);
    setSubmitError(false);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const canSend = !!selected && selected.id !== source.id && !submitting;

  const handleSend = async () => {
    if (!selected || !canSend) return;
    setSubmitting(true);
    setSubmitError(false);
    try {
      const message = composeMergeCandidateMessage({
        source,
        target: { id: selected.id, name: selected.primary_name },
        note,
      });
      await submitReport(message, buildWebReportContext('GameDetail'));
      handleClose();
      pushToast({ type: 'success', message: t('report.thanks') });
    } catch {
      setSubmitting(false);
      setSubmitError(true);
    }
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
            <button type="button" className={styles.retry} onClick={() => void load(query.trim())}>
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
                    setSubmitError(false);
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

      {submitError && (
        <p className={styles.error} role="alert">
          {t('report.submitError')}
        </p>
      )}

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={handleClose}>
          {t('report.cancel')}
        </Button>
        <Button type="button" disabled={!canSend} onClick={() => void handleSend()}>
          {submitting ? t('report.sending') : t('report.send')}
        </Button>
      </div>
    </Modal>
  );
}
