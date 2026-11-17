import { useState, useEffect, useMemo } from 'react';
import type { FormEvent, MouseEvent } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSession } from '../hooks/useSession';
import { ConflictNotice } from '../components/ConflictNotice';
import { Button, EmptyState, Skeleton, ConfirmDialog, FieldError } from '../components/ui';
import { GameSelect } from '../components/games/GameSelect';
import {
  useCreateSession,
  usePatchSession,
  useDiscardSession,
  useDeleteSession,
} from '../hooks/useSessions';
import { classifyConflict, parseConflict } from '../lib/conflict';
import { consumeVoiceTranscriptPrefill } from '../lib/voicePrefill';
import {
  legalCreateRange,
  parseSessionBound,
  SESSION_MAX_DURATION_MS,
  validateManualSessionBounds,
} from '../lib/sessionBounds';
import type { SessionBoundCode } from '../lib/sessionBounds';

import styles from './SessionFormPage.module.css';

const toLocalDatetime = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface InitialValues {
  gameId: number | '';
  startTime: string;
  endTime: string;
}

function SessionFormSkeleton() {
  return (
    <div className={styles.container}>
      <Skeleton height={400} />
    </div>
  );
}

/**
 * Keyed by the route id so moving from add to edit (for example via the overlap
 * notice link) mounts a fresh form instead of keeping the typed values and the
 * failed create error, which then looked like a writer conflict on that session.
 */
export function SessionFormPage() {
  const { id } = useParams();
  return <SessionForm key={id ?? 'new'} />;
}

function SessionForm() {
  const { t } = useTranslation('sessions');
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditing = !!id;
  const sessionId = Number(id);

  const [gameId, setGameId] = useState<number | ''>('');
  const [gameName, setGameName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [initialValues, setInitialValues] = useState<InitialValues | null>(null);
  const [dismissedConflict, setDismissedConflict] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [discardTarget, setDiscardTarget] = useState<string | -1 | null>(null);
  const [boundCode, setBoundCode] = useState<SessionBoundCode | 'errorNeedsEnd' | null>(null);

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
      const initGameId = session.game_id;
      const initStart = toLocalDatetime(session.start_time);
      const initEnd = session.end_time ? toLocalDatetime(session.end_time) : '';
      setGameId(initGameId);
      setStartTime(initStart);
      if (session.end_time) setEndTime(initEnd);
      setInitialValues({ gameId: initGameId, startTime: initStart, endTime: initEnd });
      setInitialized(true);
    } else if (!isEditing && !initialized) {
      const qGameId = searchParams.get('gameId');
      const qStart = searchParams.get('startTime');
      const qEnd = searchParams.get('endTime');
      let initGameId: number | '' = '';
      if (qGameId) {
        initGameId = Number(qGameId);
        setGameId(initGameId);
      }
      const qGameName = searchParams.get('gameName');
      if (qGameName) setGameName(qGameName);
      const transcript = consumeVoiceTranscriptPrefill();
      if (transcript) setVoiceNote(transcript);
      let initStart: string;
      let initEnd = '';
      if (qStart) {
        initStart = qStart;
        setStartTime(qStart);
        if (qEnd) {
          initEnd = qEnd;
          setEndTime(qEnd);
        }
      } else {
        const range = legalCreateRange(new Date(), toLocalDatetime);
        initStart = range.start;
        initEnd = range.end;
        setStartTime(range.start);
        setEndTime(range.end);
      }
      setInitialValues({ gameId: initGameId, startTime: initStart, endTime: initEnd });
      setInitialized(true);
    }
  }, [session, isEditing, initialized, searchParams]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const clearConflict = () => setDismissedConflict(true);

  const isDirty = Boolean(
    initialValues &&
      (gameId !== initialValues.gameId ||
        startTime !== initialValues.startTime ||
        endTime !== initialValues.endTime),
  );

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  const handleCancel = () => {
    const target: string | -1 = isEditing && session ? `/library/${session.game_id}` : -1;
    if (isDirty) {
      setDiscardTarget(target);
      setDiscardConfirmOpen(true);
    } else if (target === -1) {
      navigate(-1);
    } else {
      navigate(target);
    }
  };

  const handleBackLinkClick = (e: MouseEvent) => {
    if (isDirty && session) {
      e.preventDefault();
      setDiscardTarget(`/library/${session.game_id}`);
      setDiscardConfirmOpen(true);
    }
  };

  const onConfirmDiscard = () => {
    const target = discardTarget;
    setDiscardConfirmOpen(false);
    setDiscardTarget(null);
    if (target === -1) {
      navigate(-1);
    } else if (target) {
      navigate(target);
    }
  };

  const onCancelDiscard = () => {
    setDiscardConfirmOpen(false);
    setDiscardTarget(null);
  };

  if (isEditing && isLoading) return <SessionFormSkeleton />;

  if (isEditing && session?.status === 'ONGOING') {
    return (
      <div className={styles.container}>
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

    if (isEditing && session?.status === 'ERROR' && !endTime) {
      setBoundCode('errorNeedsEnd');
      return;
    }
    if (!endTime) return;
    const startInstant = isEditing && session
      ? new Date(session.start_time)
      : new Date(startTime);
    const endInstant = new Date(endTime);
    const code = validateManualSessionBounds({
      start: startInstant,
      end: endInstant,
      isCreate: !isEditing,
    });
    if (code) {
      setBoundCode(code);
      return;
    }
    setBoundCode(null);

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

  const serverCode = parseSessionBound(createMut.error) ?? parseSessionBound(updateMut.error);
  const shown = boundCode ?? serverCode;
  const isStartError = shown === 'lookback' || shown === 'futureStart';
  const isEndError = shown !== null && !isStartError;
  const isLongOpen =
    isEditing &&
    session?.status === 'ERROR' &&
    // eslint-disable-next-line react-hooks/purity -- advisory evaluated at render from stored start
    Date.now() - new Date(session.start_time).getTime() > SESSION_MAX_DURATION_MS;

  const noGame = !isEditing && !gameId;

  return (
    <div className={styles.container}>
      {isEditing && session && (
        <Link
          to={`/library/${session.game_id}`}
          className={styles.backLink}
          onClick={handleBackLinkClick}
        >
          {t('ongoing.back')}
        </Link>
      )}

      {conflict && (
        <ConflictNotice
          conflict={conflict}
          kind={classifyConflict(conflict, isEditing ? sessionId : undefined)}
        />
      )}

      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.inputGroup}>
          <label htmlFor="session-game" className={styles.label}>{t('fields.game')}</label>
          <GameSelect
            id="session-game"
            value={gameId}
            onChange={(v) => { setGameId(v); clearConflict(); }}
            disabled={isEditing || pending}
            aria-label={t('fields.game')}
            initialQuery={gameName || undefined}
          />
          {noGame && (
            <p id="session-game-hint" className={styles.fieldHint}>
              {t('fields.gameRequired')}
            </p>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="session-start" className={styles.label}>{t('fields.start')}</label>
          <input
            id="session-start"
            type="datetime-local"
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value);
              setBoundCode(null);
              createMut.reset();
              updateMut.reset();
              clearConflict();
            }}
            className={styles.input}
            disabled={isEditing || pending}
            required
            aria-invalid={isStartError ? true : undefined}
            aria-describedby={isStartError ? 'session-start-error' : undefined}
          />
          {isStartError && (
            <FieldError id="session-start-error">
              {shown && t(`bounds.${shown}`)}
            </FieldError>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="session-end" className={styles.label}>{t('fields.end')}</label>
          <input
            id="session-end"
            type="datetime-local"
            value={endTime}
            onChange={(e) => {
              setEndTime(e.target.value);
              setBoundCode(null);
              createMut.reset();
              updateMut.reset();
              clearConflict();
            }}
            className={styles.input}
            disabled={pending}
            required={!isEditing}
            aria-invalid={isEndError ? true : undefined}
            aria-describedby={
              [isEndError && 'session-end-error', isLongOpen && 'session-long-open']
                .filter(Boolean)
                .join(' ') || undefined
            }
          />
          {isEndError && (
            <FieldError id="session-end-error">
              {shown && t(`bounds.${shown}`)}
            </FieldError>
          )}
          {isLongOpen && (
            <p id="session-long-open" className={styles.fieldHint}>
              {t('bounds.errorTooLong')}
            </p>
          )}
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
          <Button
            type="submit"
            variant="primary"
            disabled={pending || noGame}
            aria-describedby={noGame ? 'session-game-hint' : undefined}
          >
            {pending
              ? t('actions.saving')
              : isEditing
                ? t('actions.saveChanges')
                : t('actions.saveSession')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={handleCancel}
          >
            {t('actions.cancel')}
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
        open={discardConfirmOpen}
        title={t('discardConfirm.title')}
        message={t('discardConfirm.message')}
        confirmLabel={t('discardConfirm.confirm')}
        cancelLabel={t('discardConfirm.cancel')}
        onConfirm={onConfirmDiscard}
        onCancel={onCancelDiscard}
      />

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
