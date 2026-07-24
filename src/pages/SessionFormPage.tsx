import { useState, useEffect, useMemo } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSession } from '../hooks/useSession';
import { ConflictNotice } from '../components/ConflictNotice';
import { SectionHeader, Button, EmptyState, Skeleton, ConfirmDialog } from '../components/ui';
import { GameSelect } from '../components/games/GameSelect';
import {
  useCreateSession,
  usePatchSession,
  useDiscardSession,
  useDeleteSession,
} from '../hooks/useSessions';
import { parseConflict } from '../lib/conflict';
import { consumeVoiceTranscriptPrefill } from '../lib/voicePrefill';

import styles from './SessionFormPage.module.css';

const toLocalDatetime = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function SessionFormSkeleton() {
  return (
    <div className={styles.container}>
      <Skeleton height={20} width={200} />
      <Skeleton height={400} />
    </div>
  );
}

export function SessionFormPage() {
  const { t } = useTranslation('sessions');
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditing = !!id;
  const sessionId = Number(id);

  const [gameId, setGameId] = useState<number | ''>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [dismissedConflict, setDismissedConflict] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { data: session, isLoading } = useSession(sessionId, isEditing);

  const createMut = useCreateSession();
  const updateMut = usePatchSession(sessionId, session?.game_id);
  const discardMut = useDiscardSession(sessionId, session?.game_id);
  const deleteMut = useDeleteSession(session?.game_id);

  const conflict = useMemo(() => {
    if (dismissedConflict) return null;
    return parseConflict(createMut.error) ?? parseConflict(updateMut.error);
  }, [createMut.error, updateMut.error, dismissedConflict]);

  /* eslint-disable react-hooks/set-state-in-effect -- one-time form hydration from fetched session */
  useEffect(() => {
    if (session && isEditing && !initialized) {
      setGameId(session.game_id);
      setStartTime(toLocalDatetime(session.start_time));
      if (session.end_time) setEndTime(toLocalDatetime(session.end_time));
      setInitialized(true);
    } else if (!isEditing && !initialized) {
      const qGameId = searchParams.get('gameId');
      const qStart = searchParams.get('startTime');
      const qEnd = searchParams.get('endTime');
      if (qGameId) setGameId(Number(qGameId));
      const transcript = consumeVoiceTranscriptPrefill();
      if (transcript) setVoiceNote(transcript);
      if (qStart) {
        setStartTime(qStart);
        if (qEnd) setEndTime(qEnd);
      } else {
        const now = new Date();
        setStartTime(toLocalDatetime(now.toISOString()));
        now.setHours(now.getHours() + 1);
        setEndTime(toLocalDatetime(now.toISOString()));
      }
      setInitialized(true);
    }
  }, [session, isEditing, initialized, searchParams]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const clearConflict = () => setDismissedConflict(true);

  if (isEditing && isLoading) return <SessionFormSkeleton />;

  if (isEditing && session?.status === 'ONGOING') {
    return (
      <div className={styles.container}>
        <SectionHeader title={t('title.edit')} />
        <EmptyState message={t('ongoing.message')} />
        <Link to={`/library/${session.game_id}`} className={styles.backLink}>
          {t('ongoing.back')}
        </Link>
      </div>
    );
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!gameId || !startTime) return;
    setDismissedConflict(false);
    createMut.reset();
    updateMut.reset();

    if (isEditing) {
      updateMut.mutate(
        { end_time: endTime ? new Date(endTime).toISOString() : undefined },
        { onSuccess: () => navigate(-1) },
      );
    } else {
      createMut.mutate(
        {
          game_id: Number(gameId),
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
        },
        { onSuccess: () => navigate('/') },
      );
    }
  };

  const pending =
    createMut.isPending || updateMut.isPending || discardMut.isPending || deleteMut.isPending;

  return (
    <div className={styles.container}>
      <SectionHeader title={isEditing ? t('title.edit') : t('title.add')} />

      {conflict && <ConflictNotice conflict={conflict} />}

      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.inputGroup}>
          <label htmlFor="session-game" className={styles.label}>{t('fields.game')}</label>
          <GameSelect
            id="session-game"
            value={gameId}
            onChange={(v) => { setGameId(v); clearConflict(); }}
            disabled={isEditing || pending}
            aria-label={t('fields.game')}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="session-start" className={styles.label}>{t('fields.start')}</label>
          <input
            id="session-start"
            type="datetime-local"
            value={startTime}
            onChange={(e) => { setStartTime(e.target.value); clearConflict(); }}
            className={styles.input}
            disabled={isEditing || pending}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="session-end" className={styles.label}>{t('fields.end')}</label>
          <input
            id="session-end"
            type="datetime-local"
            value={endTime}
            onChange={(e) => { setEndTime(e.target.value); clearConflict(); }}
            className={styles.input}
            disabled={pending}
            required={!isEditing}
          />
        </div>

        {isEditing && session?.notes && (
          <div className={styles.inputGroup}>
            <span className={styles.label}>{t('fields.systemNote')}</span>
            <p className={styles.notesReadonly}>{session.notes}</p>
          </div>
        )}

        {!isEditing && voiceNote && (
          <div className={styles.inputGroup}>
            <span className={styles.label}>{t('fields.transcriptPreview')}</span>
            <p className={styles.notesHint}>{t('fields.transcriptHint')}</p>
            <p className={styles.notesReadonly}>{voiceNote}</p>
          </div>
        )}

        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending
              ? t('actions.saving')
              : isEditing
                ? t('actions.saveChanges')
                : t('actions.saveSession')}
          </Button>
          {!isEditing && (
            <Button type="button" variant="secondary" disabled={pending} onClick={() => navigate('/voice')}>
              {t('actions.recordVoice')}
            </Button>
          )}
          {isEditing && session?.status === 'ERROR' && (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => discardMut.mutate(undefined, { onSuccess: () => navigate(-1) })}
            >
              {t('actions.discard')}
            </Button>
          )}
          {isEditing && session?.status === 'COMPLETED' && (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => setDeleteConfirmOpen(true)}
            >
              {t('actions.delete')}
            </Button>
          )}
        </div>
      </form>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t('deleteConfirm.title')}
        message={t('deleteConfirm.message')}
        confirmLabel={t('deleteConfirm.confirm')}
        variant="danger"
        loading={deleteMut.isPending}
        onConfirm={() =>
          deleteMut.mutate(sessionId, {
            onSuccess: () => {
              setDeleteConfirmOpen(false);
              navigate('/');
            },
          })
        }
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
