import { useState, useMemo } from 'react';
import { useGamesAll, useMergeGame } from '../../hooks/useGames';
import { Button, ConfirmDialog } from '../ui';
import styles from './MergeDialog.module.css';

interface MergeDialogProps {
  sourceId: number;
  sourceName: string;
  onClose: () => void;
}

export function MergeDialog({ sourceId, sourceName, onClose }: MergeDialogProps) {
  const [query, setQuery] = useState('');
  const [targetId, setTargetId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data: games } = useGamesAll();
  const merge = useMergeGame(sourceId);

  const targetGame = games?.find((g) => g.id === targetId);

  const candidates = useMemo(() => {
    const list = (games ?? []).filter((g) => g.id !== sourceId);
    if (!query.trim()) return list.slice(0, 20);
    const q = query.toLowerCase();
    return list.filter((g) => g.primary_name.toLowerCase().includes(q)).slice(0, 20);
  }, [games, sourceId, query]);

  const handleMerge = () => {
    if (!targetId || targetId === sourceId) return;
    merge.mutate(targetId, { onSuccess: () => onClose() });
  };

  return (
    <>
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2 className={styles.title}>POŁĄCZ Z GRĄ</h2>
        <p className={styles.sub}>
          Sesje z <strong>{sourceName}</strong> zostaną przeniesione do wybranej gry.
        </p>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj gry docelowej..."
          className={styles.search}
          autoFocus
        />

        <ul className={styles.list}>
          {candidates.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                className={[styles.option, targetId === g.id ? styles.optionActive : ''].filter(Boolean).join(' ')}
                onClick={() => setTargetId(g.id)}
              >
                {g.primary_name}
              </button>
            </li>
          ))}
          {candidates.length === 0 && (
            <li className={styles.empty}>Brak pasujących gier</li>
          )}
        </ul>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={merge.isPending}>
            ANULUJ
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!targetId || merge.isPending}
            onClick={() => setConfirmOpen(true)}
          >
            POŁĄCZ
          </Button>
        </div>
      </div>
    </div>

    <ConfirmDialog
      open={confirmOpen}
      title="POŁĄCZ GRY"
      message={`Połączyć „${sourceName}" z „${targetGame?.primary_name ?? 'wybraną grą'}"? Tej operacji nie można cofnąć.`}
      confirmLabel="POŁĄCZ"
      variant="danger"
      loading={merge.isPending}
      onConfirm={handleMerge}
      onCancel={() => setConfirmOpen(false)}
    />
    </>
  );
}