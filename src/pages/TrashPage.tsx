import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ConflictResponse } from '../types/api';
import { useTrash } from '../hooks/useTrash';
import { hardDeleteSession } from '../api/sessions';
import { useRestoreSession } from '../hooks/useSessions';
import { ConflictNotice } from '../components/ConflictNotice';
import { Cover } from '../components/Cover';
import { SectionHeader, Button, EmptyState, Skeleton, ConfirmDialog } from '../components/ui';
import { useToastStore } from '../store/toastStore';
import { parseConflict } from '../lib/conflict';
import { qk } from '../lib/queryKeys';
import { useFormat } from '../hooks/useFormat';
import styles from './TrashPage.module.css';

function TrashSkeleton() {
  return (
    <div className={styles.table}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} height={56} />
      ))}
    </div>
  );
}

export function TrashPage() {
  const { formatDate, formatDaysUntil } = useFormat();
  const { data: trash, isLoading } = useTrash();
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);
  const [restoreConflict, setRestoreConflict] = useState<ConflictResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const restoreMut = useRestoreSession();

  const deleteMut = useMutation({
    mutationFn: hardDeleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.trash });
      pushToast({ type: 'success', message: 'Sesja trwale usunięta.' });
      setDeleteTarget(null);
    },
    onError: () => {
      pushToast({ type: 'error', message: 'Nie udało się usunąć sesji.' });
    },
  });

  const handleRestore = (sessionId: number) => {
    setRestoreConflict(null);
    restoreMut.mutate(sessionId, {
      onError: (err) => {
        const conflict = parseConflict(err);
        if (conflict) setRestoreConflict(conflict);
      },
    });
  };

  const deleteSession = trash?.find((s) => s.id === deleteTarget);

  return (
    <div className={styles.container}>
      <SectionHeader title="Kosz" />

      {restoreConflict && <ConflictNotice conflict={restoreConflict} />}

      {isLoading && <TrashSkeleton />}

      {!isLoading && (!trash || trash.length === 0) && (
        <EmptyState message="Kosz jest pusty." />
      )}

      {!isLoading && trash && trash.length > 0 && (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Gra</span>
            <span>Usunięto</span>
            <span>Wygasa za</span>
            <span>Akcje</span>
          </div>
          {trash.map((session) => (
            <div key={session.id} className={styles.row}>
              <div className={styles.gameCell}>
                <Cover
                  coverImageUrl={session.game?.cover_image_url}
                  placeholderChar={session.game?.primary_name}
                  className={styles.cover}
                />
                <span className={styles.gameName}>
                  {session.game?.primary_name || 'Nieznana gra'}
                </span>
              </div>
              <span className={styles.metaCell}>
                {session.deleted_at ? formatDate(session.deleted_at) : '—'}
              </span>
              <span className={styles.metaCell}>{formatDaysUntil(session.purges_at)}</span>
              <div className={styles.actions}>
                <Button
                  onClick={() => handleRestore(session.id)}
                  disabled={restoreMut.isPending || deleteMut.isPending}
                  variant="primary"
                >
                  PRZYWRÓĆ
                </Button>
                <Button
                  onClick={() => setDeleteTarget(session.id)}
                  disabled={restoreMut.isPending || deleteMut.isPending}
                  variant="secondary"
                >
                  USUŃ TRWALE
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget != null}
        title="USUŃ TRWALE"
        message={
          deleteSession
            ? `Czy na pewno chcesz trwale usunąć sesję „${deleteSession.game?.primary_name ?? 'nieznana'}"? Tej operacji nie można cofnąć.`
            : 'Czy na pewno chcesz trwale usunąć tę sesję?'
        }
        confirmLabel="USUŃ TRWALE"
        variant="danger"
        loading={deleteMut.isPending}
        onConfirm={() => deleteTarget != null && deleteMut.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}