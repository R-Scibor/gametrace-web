import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  addGameAlias,
  adminMatchGames,
  adminUploadCover,
  getAdminGames,
  linkGameToIgdb,
  requeueEnrichment,
} from '../api/admin';
import { fileToBase64 } from '../lib/files';
import { qk } from '../lib/queryKeys';
import { useGamesStore } from '../store/gamesStore';
import { useToastStore } from '../store/toastStore';
import type { AdminGamesQuery } from '../types/api';

function catalogConflictId(err: unknown): number | undefined {
  if (!axios.isAxiosError(err)) return undefined;
  const detail = err.response?.data?.detail;
  if (detail && typeof detail === 'object' && 'conflicting_game_id' in detail) {
    return Number((detail as { conflicting_game_id: number }).conflicting_game_id);
  }
  return undefined;
}

export function useAdminUploadCover(gameId: number) {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);
  const invalidateGames = useGamesStore((s) => s.invalidate);

  return useMutation({
    mutationFn: async (file: File) => {
      const { base64, extension } = await fileToBase64(file);
      return adminUploadCover(gameId, { image_base64: base64, extension });
    },
    onSuccess: (game) => {
      queryClient.setQueryData(qk.game(gameId), game);
      queryClient.invalidateQueries({ queryKey: ['games'] });
      invalidateGames();
      pushToast({ type: 'success', message: 'Globalna okładka zapisana.' });
    },
    onError: (err) => {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const message =
        status === 403
          ? 'Brak uprawnień.'
          : status === 422
            ? 'Nieprawidłowy plik obrazu.'
            : 'Nie udało się zapisać globalnej okładki.';
      pushToast({ type: 'error', message });
    },
  });
}

export function useAdminGames(filter: AdminGamesQuery) {
  return useQuery({
    queryKey: qk.adminGames(filter),
    queryFn: () => getAdminGames(filter),
  });
}

export function useRequeueEnrichment() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);
  const invalidateGames = useGamesStore((s) => s.invalidate);

  return useMutation({
    mutationFn: (gameId: number) => requeueEnrichment(gameId),
    onSuccess: (_data, gameId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'games'] });
      queryClient.invalidateQueries({ queryKey: qk.game(gameId) });
      invalidateGames();
      pushToast({ type: 'success', message: 'Wzbogacanie dodane do kolejki.' });
    },
    onError: (err) => {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      pushToast({
        type: 'error',
        message:
          status === 403 ? 'Brak uprawnień.' : 'Nie udało się dodać wzbogacania do kolejki.',
      });
    },
  });
}

export function useAdminMatch() {
  return useMutation({
    mutationFn: (query: string) => adminMatchGames(query),
    onError: (err) => {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const pushToast = useToastStore.getState().pushToast;
      const message =
        status === 502 || status === 503
          ? 'Baza gier tymczasowo niedostępna.'
          : 'Nie udało się wyszukać w IGDB.';
      pushToast({ type: 'error', message });
    },
  });
}

export function useLinkIgdb(gameId: number) {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);
  const invalidateGames = useGamesStore((s) => s.invalidate);

  return useMutation({
    mutationFn: (igdbId: number) => linkGameToIgdb(gameId, igdbId),
    onSuccess: (game) => {
      queryClient.setQueryData(qk.game(gameId), game);
      queryClient.invalidateQueries({ queryKey: ['admin', 'games'] });
      queryClient.invalidateQueries({ queryKey: ['games'] });
      invalidateGames();
      pushToast({ type: 'success', message: 'Gra powiązana z IGDB.' });
    },
    onError: (err) => {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const conflictId = catalogConflictId(err);
      if (status === 409 && conflictId) {
        pushToast({
          type: 'error',
          message: `Gra IGDB już istnieje (ID: ${conflictId}). Połącz gry zamiast tego.`,
        });
        return;
      }
      const message =
        status === 502 || status === 503
          ? 'Baza gier tymczasowo niedostępna.'
          : status === 403
            ? 'Brak uprawnień.'
            : 'Nie udało się powiązać z IGDB.';
      pushToast({ type: 'error', message });
    },
  });
}

export function useAddAlias(gameId: number) {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);

  return useMutation({
    mutationFn: (discordProcessName: string) => addGameAlias(gameId, discordProcessName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'games'] });
      pushToast({ type: 'success', message: 'Alias dodany.' });
    },
    onError: (err) => {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const conflictId = catalogConflictId(err);
      if (status === 409 && conflictId) {
        pushToast({
          type: 'error',
          message: `Alias należy do innej gry (ID: ${conflictId}).`,
        });
        return;
      }
      const message =
        status === 422
          ? 'Nazwa procesu nie może być pusta.'
          : status === 403
            ? 'Brak uprawnień.'
            : 'Nie udało się dodać aliasu.';
      pushToast({ type: 'error', message });
    },
  });
}