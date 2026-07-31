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
import { adminMergeGame } from '../api/games';
import i18n from '../i18n';
import { fileToBase64 } from '../lib/files';
import { qk } from '../lib/queryKeys';
import { useGamesStore } from '../store/gamesStore';
import { useToastStore } from '../store/toastStore';
import type { AdminGamesQuery } from '../types/api';

const SEARCH_LIMIT = 10;

function catalogConflictId(err: unknown): number | undefined {
  if (!axios.isAxiosError(err)) return undefined;
  const detail = err.response?.data?.detail;
  if (detail && typeof detail === 'object' && 'conflicting_game_id' in detail) {
    return Number((detail as { conflicting_game_id: number }).conflicting_game_id);
  }
  return undefined;
}

/** Every catalog mutation moves a number the overview hub displays. */
function invalidateCatalog(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: qk.adminGamesPrefix });
  queryClient.invalidateQueries({ queryKey: qk.adminOverview });
}

export function useAdminGames(
  filter: AdminGamesQuery,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: qk.adminGames(filter),
    queryFn: () => getAdminGames(filter),
    enabled: options?.enabled,
  });
}

/**
 * Merge target picker. Queries the global admin catalog with no status filter so
 * duplicates the admin has never played are findable. Do not swap this for
 * useGameSearch, which only sees the admin's own library.
 */
export function useAdminGameSearch(query: string, excludeId?: number) {
  return useQuery({
    queryKey: qk.adminGames({ search: query, excludeId }),
    queryFn: () => getAdminGames({ q: query || undefined, limit: SEARCH_LIMIT, sort: 'name_asc' }),
    enabled: query.trim().length > 0,
    select: (data) => data.items.filter((g) => g.id !== excludeId),
  });
}

export function useRequeueEnrichment() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);

  return useMutation({
    mutationFn: (gameId: number) => requeueEnrichment(gameId),
    onSuccess: () => {
      invalidateCatalog(queryClient);
      pushToast({ type: 'success', message: i18n.t('admin:catalog.toast.requeueSuccess') });
    },
    onError: (err) => {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      pushToast({
        type: 'error',
        message: status === 403 ? i18n.t('admin:common.forbidden') : i18n.t('admin:catalog.toast.requeueFailed'),
      });
    },
  });
}

export function useAdminMatch() {
  const pushToast = useToastStore((s) => s.pushToast);

  return useMutation({
    mutationFn: (query: string) => adminMatchGames(query),
    onError: (err) => {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      pushToast({
        type: 'error',
        message:
          status === 502 || status === 503
            ? i18n.t('admin:catalog.toast.igdbUnavailable')
            : i18n.t('admin:catalog.toast.igdbSearchFailed'),
      });
    },
  });
}

export function useLinkIgdb(gameId: number) {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);

  return useMutation({
    mutationFn: (igdbId: number) => linkGameToIgdb(gameId, igdbId),
    onSuccess: (game) => {
      queryClient.setQueryData(qk.game(gameId), game);
      invalidateCatalog(queryClient);
      pushToast({ type: 'success', message: i18n.t('admin:catalog.toast.igdbLinked') });
    },
    onError: (err) => {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const conflictId = catalogConflictId(err);
      if (status === 409 && conflictId) {
        pushToast({
          type: 'error',
          message: i18n.t('admin:catalog.toast.igdbConflict'),
          action: { label: i18n.t('admin:common.showGame'), to: `/admin/catalog?game=${conflictId}` },
        });
        return;
      }
      pushToast({
        type: 'error',
        message:
          status === 502 || status === 503
            ? i18n.t('admin:catalog.toast.igdbUnavailable')
            : status === 403
              ? i18n.t('admin:common.forbidden')
              : i18n.t('admin:catalog.toast.igdbLinkFailed'),
      });
    },
  });
}

export function useAddAlias(gameId: number) {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);

  return useMutation({
    mutationFn: (discordProcessName: string) => addGameAlias(gameId, discordProcessName),
    onSuccess: () => {
      invalidateCatalog(queryClient);
      pushToast({ type: 'success', message: i18n.t('admin:catalog.toast.aliasAdded') });
    },
    onError: (err) => {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const conflictId = catalogConflictId(err);
      if (status === 409 && conflictId) {
        pushToast({
          type: 'error',
          message: i18n.t('admin:catalog.toast.aliasConflict'),
          action: { label: i18n.t('admin:common.showGame'), to: `/admin/catalog?game=${conflictId}` },
        });
        return;
      }
      pushToast({
        type: 'error',
        message:
          status === 422
            ? i18n.t('admin:catalog.toast.aliasEmpty')
            : status === 403
              ? i18n.t('admin:common.forbidden')
              : i18n.t('admin:catalog.toast.aliasFailed'),
      });
    },
  });
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
      invalidateCatalog(queryClient);
      invalidateGames();
      pushToast({ type: 'success', message: i18n.t('admin:catalog.toast.coverSaved') });
    },
    onError: (err) => {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      pushToast({
        type: 'error',
        message:
          status === 403
            ? i18n.t('admin:common.forbidden')
            : status === 422
              ? i18n.t('admin:catalog.toast.coverInvalid')
              : i18n.t('admin:catalog.toast.coverFailed'),
      });
    },
  });
}

/**
 * Admin merge. Unlike useMergeGame in useGames.ts this does not navigate to the
 * library, because that would eject the admin from the catalog mid-cleanup.
 */
export function useAdminMergeGame(sourceId: number, onMerged: (targetId: number) => void) {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);
  const invalidateGames = useGamesStore((s) => s.invalidate);

  return useMutation({
    mutationFn: (targetId: number) => adminMergeGame(sourceId, targetId),
    onSuccess: (_data, targetId) => {
      invalidateCatalog(queryClient);
      queryClient.invalidateQueries({ queryKey: qk.gamesPrefix });
      queryClient.invalidateQueries({ queryKey: qk.statsPrefix });
      invalidateGames();
      pushToast({ type: 'success', message: i18n.t('admin:catalog.toast.merged') });
      onMerged(targetId);
    },
    onError: (err) => {
      const forbidden = axios.isAxiosError(err) && err.response?.status === 403;
      pushToast({
        type: 'error',
        message: forbidden ? i18n.t('admin:catalog.toast.mergeForbidden') : i18n.t('admin:catalog.toast.mergeFailed'),
      });
    },
  });
}
