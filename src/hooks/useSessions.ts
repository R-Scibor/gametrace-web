import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listSessions,
  createSession,
  patchSession,
  deleteSession,
  restoreSession,
} from '../api/sessions';
import i18n from '../i18n';
import { isConflictStatus, parseConflict } from '../lib/conflict';
import { qk } from '../lib/queryKeys';
import { parseSessionBound } from '../lib/sessionBounds';
import { useToastStore, type ToastMessage } from '../store/toastStore';
import type { SessionCreate, SessionPatch } from '../types/api';

const RECENT_LIMIT = 8;

function invalidateAfterSessionChange(queryClient: ReturnType<typeof useQueryClient>, gameId?: number) {
  queryClient.invalidateQueries({ queryKey: qk.dashboard });
  queryClient.invalidateQueries({ queryKey: qk.sessions() });
  queryClient.invalidateQueries({ queryKey: qk.statsPrefix });
  // Library membership is session-derived, so a session change can add a game to
  // the library or shift its playtime totals. Without this, a game created via the
  // picker ladder stays invisible for the picker query's 60s staleTime.
  queryClient.invalidateQueries({ queryKey: qk.gamesPrefix });
  if (gameId != null) {
    queryClient.invalidateQueries({ queryKey: qk.gameSessions(gameId) });
  }
}

/**
 * A 409 with a parsable conflicting_session is shown inline by the page (ConflictNotice),
 * so it must not toast. A 409 without one has no inline UI, so it gets a generic
 * conflict toast instead of failing silently. Returns true when the error was a 409.
 */
function handleConflictError(err: unknown, pushToast: (toast: Omit<ToastMessage, 'id'>) => void): boolean {
  if (!isConflictStatus(err)) return false;
  if (!parseConflict(err)) {
    pushToast({ type: 'error', message: i18n.t('sessions:toast.conflictUnknown') });
  }
  return true;
}

export function useRecentSessions(activeSessionId?: number | null) {
  return useQuery({
    queryKey: qk.sessions({ recent: true, activeSessionId: activeSessionId ?? null }),
    queryFn: () => listSessions({ status: ['COMPLETED', 'ERROR'], limit: RECENT_LIMIT }),
    refetchInterval: 30_000,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);

  return useMutation({
    mutationFn: createSession,
    onSuccess: (_data, vars: SessionCreate) => {
      invalidateAfterSessionChange(queryClient, vars.game_id);
      pushToast({ type: 'success', message: i18n.t('sessions:toast.saved') });
    },
    onError: (err) => {
      if (handleConflictError(err, pushToast)) return;
      if (parseSessionBound(err)) return;
      pushToast({ type: 'error', message: i18n.t('sessions:toast.saveFailed') });
    },
  });
}

export function usePatchSession(sessionId: number, gameId?: number) {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);

  return useMutation({
    mutationFn: (payload: SessionPatch) => patchSession(sessionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.session(sessionId) });
      invalidateAfterSessionChange(queryClient, gameId);
      pushToast({ type: 'success', message: i18n.t('sessions:toast.changesSaved') });
    },
    onError: (err) => {
      if (handleConflictError(err, pushToast)) return;
      if (parseSessionBound(err)) return;
      pushToast({ type: 'error', message: i18n.t('sessions:toast.changesFailed') });
    },
  });
}

// ERROR sessions: backend has no separate "discard" — DELETE soft-deletes like trash.
// UI copy differs; trash cache is not invalidated here (user left the edit flow).
export function useDiscardSession(sessionId: number, gameId?: number) {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);

  return useMutation({
    mutationFn: () => deleteSession(sessionId),
    onSuccess: () => {
      invalidateAfterSessionChange(queryClient, gameId);
      pushToast({ type: 'success', message: i18n.t('sessions:toast.discarded') });
    },
    onError: () => {
      pushToast({ type: 'error', message: i18n.t('sessions:toast.discardFailed') });
    },
  });
}

export function useRestoreSession() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);

  return useMutation({
    mutationFn: restoreSession,
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: qk.trash });
      invalidateAfterSessionChange(queryClient, session.game_id);
      pushToast({ type: 'success', message: i18n.t('sessions:toast.restored') });
    },
    onError: (err) => {
      if (handleConflictError(err, pushToast)) return;
      pushToast({ type: 'error', message: i18n.t('sessions:toast.restoreFailed') });
    },
  });
}

export function useDeleteSession(gameId?: number) {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);

  return useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      invalidateAfterSessionChange(queryClient, gameId);
      queryClient.invalidateQueries({ queryKey: qk.trash });
      pushToast({ type: 'success', message: i18n.t('sessions:toast.movedToTrash') });
    },
    onError: () => {
      pushToast({ type: 'error', message: i18n.t('sessions:toast.deleteFailed') });
    },
  });
}