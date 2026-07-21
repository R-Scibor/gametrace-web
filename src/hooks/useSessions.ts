import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  listSessions,
  createSession,
  patchSession,
  deleteSession,
  restoreSession,
} from '../api/sessions';
import { qk } from '../lib/queryKeys';
import { useToastStore } from '../store/toastStore';
import type { SessionCreate, SessionPatch } from '../types/api';

const RECENT_LIMIT = 8;

function invalidateAfterSessionChange(queryClient: ReturnType<typeof useQueryClient>, gameId?: number) {
  queryClient.invalidateQueries({ queryKey: qk.dashboard });
  queryClient.invalidateQueries({ queryKey: qk.sessions() });
  queryClient.invalidateQueries({ queryKey: qk.statsPrefix });
  if (gameId != null) {
    queryClient.invalidateQueries({ queryKey: qk.gameSessions(gameId) });
  }
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
      pushToast({ type: 'success', message: 'Sesja zapisana.' });
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) return;
      pushToast({ type: 'error', message: 'Nie udało się zapisać sesji.' });
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
      pushToast({ type: 'success', message: 'Zmiany zapisane.' });
    },
    onError: () => {
      pushToast({ type: 'error', message: 'Nie udało się zapisać zmian.' });
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
      pushToast({ type: 'success', message: 'Sesja odrzucona.' });
    },
    onError: () => {
      pushToast({ type: 'error', message: 'Nie udało się odrzucić sesji.' });
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
      pushToast({ type: 'success', message: 'Sesja przywrócona.' });
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) return;
      pushToast({ type: 'error', message: 'Nie udało się przywrócić sesji.' });
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
      pushToast({ type: 'success', message: 'Sesja przeniesiona do kosza.' });
    },
    onError: () => {
      pushToast({ type: 'error', message: 'Nie udało się usunąć sesji.' });
    },
  });
}