import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getGames, mergeGame, uploadCover } from '../api/games';
import { deletePreference, upsertPreference } from '../api/preferences';
import { qk } from '../lib/queryKeys';
import { fileToBase64 } from '../lib/files';
import { useToastStore } from '../store/toastStore';
import type { EnrichmentStatus } from '../types/api';

export const GAMES_PAGE_SIZE = 40;

/** Full list for selects, game detail lookup, merge picker */
export function useGamesAll(status?: EnrichmentStatus) {
  return useQuery({
    queryKey: qk.games(status),
    queryFn: () => getGames(0, 1000, status),
  });
}

/** Paginated list for library grid */
export function useGamesPaginated(status?: EnrichmentStatus) {
  return useInfiniteQuery({
    queryKey: [...qk.games(status), 'pages'] as const,
    queryFn: ({ pageParam }) => getGames(pageParam, GAMES_PAGE_SIZE, status),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _all, lastPageParam) =>
      lastPage.length < GAMES_PAGE_SIZE ? undefined : lastPageParam + GAMES_PAGE_SIZE,
  });
}

export function useUploadCover(gameId: number) {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);

  return useMutation({
    mutationFn: async (file: File) => {
      const { base64, extension } = await fileToBase64(file);
      return uploadCover(gameId, base64, extension);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.games() });
      queryClient.invalidateQueries({ queryKey: qk.gameSessions(gameId) });
      pushToast({ type: 'success', message: 'Okładka zaktualizowana.' });
    },
    onError: () => {
      pushToast({ type: 'error', message: 'Nie udało się wgrać okładki.' });
    },
  });
}

export function useMergeGame(sourceId: number) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const pushToast = useToastStore((s) => s.pushToast);

  return useMutation({
    mutationFn: (targetId: number) => mergeGame(sourceId, targetId),
    onSuccess: (_data, targetId) => {
      queryClient.invalidateQueries({ queryKey: qk.games() });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      pushToast({ type: 'success', message: 'Gry połączone.' });
      navigate(`/library/${targetId}`);
    },
    onError: () => {
      pushToast({ type: 'error', message: 'Nie udało się połączyć gier.' });
    },
  });
}

export function useGamePreference(gameId: number) {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);

  return useMutation({
    mutationFn: async (ignored: boolean) => {
      if (ignored) {
        await upsertPreference(gameId, { is_ignored: true });
      } else {
        await deletePreference(gameId);
      }
      return ignored;
    },
    onSuccess: (ignored) => {
      queryClient.invalidateQueries({ queryKey: qk.games() });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      pushToast({
        type: 'success',
        message: ignored ? 'Gra ignorowana w statystykach.' : 'Gra przywrócona do biblioteki.',
      });
    },
    onError: () => {
      pushToast({ type: 'error', message: 'Nie udało się zaktualizować preferencji.' });
    },
  });
}