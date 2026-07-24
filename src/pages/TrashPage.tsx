import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('trash');
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
      <SectionHeader title={t('title')} />

      {restoreConflict && <ConflictNotice conflict={restoreConflict} />}

      {isLoading && <TrashSkeleton />}

      {!isLoading && (!trash || trash.length === 0) && (
        <EmptyState message={t('empty')} />
      )}

      {!isLoading && trash && trash.length > 0 && (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>{t('columns.game')}</span>
            <span>{t('columns.session')}</span>
            <span>{t('columns.deleted')}</span>
            <span>{t('columns.expires')}</span>
            <span>{t('columns.actions')}</span>
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
                    {session.game?.primary_name || t('unknownGame')}
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
                    {t('actions.restore')}
                  </Button>
                  <Button
                    onClick={() => setDeleteTarget(session.id)}
                    disabled={restoreMut.isPending || deleteMut.isPending}
                    variant="secondary"
                  >
                    {t('actions.hardDelete')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget != null}
        title={t('confirm.title')}
        message={
          deleteSession ? (
            <div className={styles.confirmBody}>
              <p>
                {t('confirm.messageNamed', {
                  name: deleteSession.game?.primary_name ?? t('confirm.unknownName'),
                })}
              </p>
              <dl className={styles.confirmDetails}>
                <div>
                  <dt>{t('confirm.window')}</dt>
                  <dd>
                    {formatSessionWindow(deleteSession.start_time, deleteSession.end_time)}
                  </dd>
                </div>
                <div>
                  <dt>{t('confirm.duration')}</dt>
                  <dd>{formatDuration(deleteSession.duration_seconds)}</dd>
                </div>
                {SESSION_STATUS_LABEL[deleteSession.status] && (
                  <div>
                    <dt>{t('confirm.status')}</dt>
                    <dd>{SESSION_STATUS_LABEL[deleteSession.status]}</dd>
                  </div>
                )}
                {deleteSession.notes && (
                  <div>
                    <dt>{t('confirm.note')}</dt>
                    <dd>{deleteSession.notes}</dd>
                  </div>
                )}
              </dl>
            </div>
          ) : (
            t('confirm.messageGeneric')
          )
        }
        confirmLabel={t('confirm.confirm')}
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
