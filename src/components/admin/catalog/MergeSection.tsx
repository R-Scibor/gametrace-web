import { useState } from 'react';
import { useAdminGameSearch, useAdminMergeGame } from '../../../hooks/useAdminCatalog';
import type { AdminGameItem } from '../../../types/api';
import { Button, ConfirmDialog, Input } from '../../ui';
import styles from './MergeSection.module.css';

interface MergeSectionProps {
  gameId: number;
  onMerged: (targetId: number) => void;
}

export function MergeSection({ gameId, onMerged }: MergeSectionProps) {
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState<AdminGameItem | null>(null);
  const { data: candidates = [] } = useAdminGameSearch(query, gameId);
  const merge = useAdminMergeGame(gameId, onMerged);

  const confirmMerge = () => {
    if (!target) return;
    merge.mutate(target.id, { onSuccess: () => setTarget(null) });
  };

  return (
    <div className={styles.zone}>
      <Input
        className={styles.input}
        aria-label="Szukaj gry docelowej"
        placeholder="nazwa gry docelowej"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className={styles.results}>
        {candidates.map((candidate) => (
          <div key={candidate.id} className={styles.result}>
            <span>
              {candidate.primary_name} (#{candidate.id})
            </span>
            <Button
              type="button"
              variant="secondary"
              disabled={merge.isPending}
              onClick={() => setTarget(candidate)}
            >
              Scal tutaj
            </Button>
          </div>
        ))}
      </div>

      <p className={styles.hint}>
        Ta gra zostanie połączona z wybraną pozycją. Operacji nie można cofnąć.
      </p>

      <ConfirmDialog
        open={target != null}
        title="Scal gry"
        message={
          target ? (
            <>
              Połączyć tę grę z „{target.primary_name}”? Sesje i aliasy zostaną przeniesione, a ta
              pozycja zniknie z katalogu. Tej operacji nie można cofnąć.
            </>
          ) : null
        }
        confirmLabel="Scal"
        variant="danger"
        loading={merge.isPending}
        onConfirm={confirmMerge}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
