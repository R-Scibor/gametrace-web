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
import type { SessionCreate, SessionPatch } from '../types/api';

const RECENT_LIMIT = 5;

function invalidateAfterSessionChange(queryClient: ReturnType<typeof useQueryClient>, gameId?: number) {
  queryClient.invalidateQueries({ queryKey: qk.dashboard });
  queryClient.invalidateQueries({ queryKey: qk.sessions() });
  queryClient.invalidateQueries({ queryKey: ['stats'] });
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

  return useMutation({
    mutationFn: createSession,
    onSuccess: (_data, vars: SessionCreate) => {
      invalidateAfterSessionChange(queryClient, vars.game_id);
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) return;
    },
  });
}

export function usePatchSession(sessionId: number, gameId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SessionPatch) => patchSession(sessionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.session(sessionId) });
      invalidateAfterSessionChange(queryClient, gameId);
    },
  });
}

export function useDiscardSession(sessionId: number, gameId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => patchSession(sessionId, { discard: true }),
    onSuccess: () => {
      invalidateAfterSessionChange(queryClient, gameId);
    },
  });
}

export function useRestoreSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.trash });
      queryClient.invalidateQueries({ queryKey: qk.sessions() });
      queryClient.invalidateQueries({ queryKey: qk.dashboard });
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) return;
    },
  });
}

export function useDeleteSession(gameId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      invalidateAfterSessionChange(queryClient, gameId);
      queryClient.invalidateQueries({ queryKey: qk.trash });
    },
  });
}