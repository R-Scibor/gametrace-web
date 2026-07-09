import { useState } from 'react';
import type { TrashSession } from '../types/api';
import type { ConflictResponse } from '../types/api';
import { useTrash } from '../hooks/useTrash';
import { useHardDeleteSession } from '../hooks/useHardDeleteSession';
import { useRestoreSession } from '../hooks/useSessions';
import { ConflictNotice } from '../components/ConflictNotice';
import { Cover } from '../components/Cover';
import { SectionHeader, Button, EmptyState, Skeleton, ConfirmDialog } from '../components/ui';
import { parseConflict } from '../lib/conflict';
import { SESSION_SOURCE_LABEL, SESSION_STATUS_LABEL } from '../lib/sessionLabels';
import { useFormat } from '../hooks/useFormat';
import styles from './TrashPage.module.css';

function TrashSkeleton() {
  return (
    <div className={styles.table}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} height={88} />
      ))}
    </div>
  );
}

function sessionSummary(session: TrashSession, formatDuration: (s: number | null | undefined) => string) {
  const duration = formatDuration(session.duration_seconds);
  const source = SESSION_SOURCE_LABEL[session.source];
  return [duration, source].filter(Boolean).join(' · ');
}

export function TrashPage() {
  const { formatDate, formatDaysUntil, formatDuration, formatSessionWindow } = useFormat();
  const { data: trash, isLoading } = useTrash();
  const [restoreConflict, setRestoreConflict] = useState<ConflictResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const restoreMut = useRestoreSession();
  const deleteMut = useHardDeleteSession();

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
            <span>Sesja</span>
            <span>Usunięto</span>
            <span>Wygasa za</span>
            <span>Akcje</span>
          </div>
          {trash.map((session) => {
            const statusLabel = SESSION_STATUS_LABEL[session.status];
            const isError = session.status === 'ERROR';
            return (
              <div
                key={session.id}
                className={[styles.row, isError ? styles.rowError : ''].filter(Boolean).join(' ')}
              >
                <div className={styles.gameCell}>
                  <Cover
                    gameId={session.game_id}
                    coverImageUrl={session.game?.cover_image_url}
                    placeholderChar={session.game?.primary_name}
                    className={styles.cover}
                  />
                  <span className={styles.gameName}>
                    {session.game?.primary_name || 'Nieznana gra'}
                  </span>
                </div>
                <div className={styles.sessionCell}>
                  <span className={styles.sessionWindow}>
                    {formatSessionWindow(session.start_time, session.end_time)}
                  </span>
                  <span className={styles.sessionMeta}>
                    {sessionSummary(session, formatDuration)}
                  </span>
                  {statusLabel && (
                    <span
                      className={[
                        styles.statusBadge,
                        session.status === 'ERROR' ? styles.statusError : '',
                        session.status === 'ONGOING' ? styles.statusOngoing : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {statusLabel}
                    </span>
                  )}
                  {session.notes && (
                    <p className={styles.notes} title={session.notes}>
                      {session.notes}
                    </p>
                  )}
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
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget != null}
        title="USUŃ TRWALE"
        message={
          deleteSession ? (
            <div className={styles.confirmBody}>
              <p>
                Czy na pewno chcesz trwale usunąć sesję „
                {deleteSession.game?.primary_name ?? 'nieznana'}”? Tej operacji nie można cofnąć.
              </p>
              <dl className={styles.confirmDetails}>
                <div>
                  <dt>Okno</dt>
                  <dd>
                    {formatSessionWindow(deleteSession.start_time, deleteSession.end_time)}
                  </dd>
                </div>
                <div>
                  <dt>Czas</dt>
                  <dd>{formatDuration(deleteSession.duration_seconds)}</dd>
                </div>
                {SESSION_STATUS_LABEL[deleteSession.status] && (
                  <div>
                    <dt>Status</dt>
                    <dd>{SESSION_STATUS_LABEL[deleteSession.status]}</dd>
                  </div>
                )}
                {deleteSession.notes && (
                  <div>
                    <dt>Notatka</dt>
                    <dd>{deleteSession.notes}</dd>
                  </div>
                )}
              </dl>
            </div>
          ) : (
            'Czy na pewno chcesz trwale usunąć tę sesję?'
          )
        }
        confirmLabel="USUŃ TRWALE"
        variant="danger"
        loading={deleteMut.isPending}
        onConfirm={() => {
          if (deleteTarget == null) return;
          deleteMut.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) });
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}