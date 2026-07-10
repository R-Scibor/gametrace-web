import { useEffect, useState } from 'react';
import { useAdminMatch, useLinkIgdb } from '../../hooks/useAdmin';
import type { IGDBCandidate } from '../../types/api';
import { Button, ConfirmDialog, Skeleton } from '../ui';
import styles from './IgdbLinkDialog.module.css';

interface IgdbLinkDialogProps {
  gameId: number;
  initialQuery: string;
  onClose: () => void;
}

export function IgdbLinkDialog({ gameId, initialQuery, onClose }: IgdbLinkDialogProps) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery.trim());
  const [selected, setSelected] = useState<IGDBCandidate | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const match = useAdminMatch();
  const link = useLinkIgdb(gameId);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length < 1) return;
    match.mutate(debouncedQuery);
  }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const candidates = match.data ?? [];

  const handleLink = () => {
    if (!selected) return;
    link.mutate(selected.igdb_id, { onSuccess: () => onClose() });
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} role="presentation">
        <div
          className={styles.dialog}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <h2 className={styles.title}>POWIĄŻ Z IGDB</h2>
          <p className={styles.sub}>Wybierz dopasowanie z bazy IGDB.</p>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj w IGDB..."
            className={styles.search}
            autoFocus
          />

          <ul className={styles.list}>
            {match.isPending && (
              <li className={styles.empty}>
                <Skeleton height={48} />
              </li>
            )}
            {!match.isPending &&
              candidates.map((c) => (
                <li key={c.igdb_id}>
                  <button
                    type="button"
                    className={[
                      styles.option,
                      selected?.igdb_id === c.igdb_id ? styles.optionActive : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setSelected(c)}
                  >
                    {c.cover_url && (
                      <img src={c.cover_url} alt="" className={styles.thumb} />
                    )}
                    <span className={styles.optionText}>
                      <span className={styles.optionName}>{c.name}</span>
                      <span className={styles.optionMeta}>
                        {c.year ?? '—'} · {Math.round(c.score * 100)}%
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            {!match.isPending && debouncedQuery && candidates.length === 0 && (
              <li className={styles.empty}>Brak dopasowań IGDB</li>
            )}
          </ul>

          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={onClose} disabled={link.isPending}>
              ANULUJ
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={!selected || link.isPending}
              onClick={() => setConfirmOpen(true)}
            >
              POWIĄŻ
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Powiązać z IGDB?"
        message={
          selected
            ? `Zastosować metadane „${selected.name}" do tej gry?`
            : 'Wybierz kandydata.'
        }
        confirmLabel="POWIĄŻ"
        onConfirm={handleLink}
        onCancel={() => setConfirmOpen(false)}
        loading={link.isPending}
      />
    </>
  );
}