import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getGames, adminMergeGame } from '../api/games';
import { upsertPreference } from '../api/preferences';
import { qk } from '../lib/queryKeys';
import { useGamesStore } from '../store/gamesStore';
import { useToastStore } from '../store/toastStore';
import type {
  EnrichmentStatus,
  Game,
  GameListResponse,
  GamePreferenceUpdate,
  GameSort,
  LibraryFilter,
} from '../types/api';

function applyGamePref(game: Game, pref: GamePreferenceUpdate): Game {
  return {
    ...game,
    is_ignored: pref.is_ignored ?? game.is_ignored,
    is_accepted: pref.is_accepted !== undefined ? pref.is_accepted : game.is_accepted,
  };
}

export const GAMES_PAGE_SIZE = 40;

export type GamesLibraryFilter = {
  status?: EnrichmentStatus;
  inLibrary?: boolean;
  q?: string;
  sort?: GameSort;
  facet?: LibraryFilter | null;
};

function findGameInCache(queryClient: QueryClient, gameId: number): Game | undefined {
  const allList = queryClient.getQueryData<Game[]>(qk.games({ source: 'all' }));
  const fromAll = allList?.find((g) => g.id === gameId);
  if (fromAll) return fromAll;

  const pages = queryClient.getQueriesData<InfiniteData<GameListResponse>>({ queryKey: ['games'] });
  for (const [, data] of pages) {
    const found = data?.pages.flatMap((page) => page.items).find((g) => g.id === gameId);
    if (found) return found;
  }
  return undefined;
}

async function fetchGameById(gameId: number, queryClient: QueryClient): Promise<Game | null> {
  const cached = findGameInCache(queryClient, gameId);
  if (cached) return cached;

  const sources = [
    getGames({ skip: 0, limit: 1000 }),
    getGames({ skip: 0, limit: 1000, inLibrary: false }),
    getGames({ skip: 0, limit: 1000, status: 'NEEDS_REVIEW' }),
  ];

  for (const source of sources) {
    const res = await source;
    const found = res.items.find((g) => g.id === gameId);
    if (found) return found;
  }
  return null;
}

async function fetchAllGameSources(): Promise<Game[]> {
  const [main, other, review] = await Promise.all([
    getGames({ skip: 0, limit: 1000 }),
    getGames({ skip: 0, limit: 1000, inLibrary: false }),
    getGames({ skip: 0, limit: 1000, status: 'NEEDS_REVIEW' }),
  ]);
  const byId = new Map<number, Game>();
  for (const game of [...main.items, ...other.items, ...review.items]) {
    byId.set(game.id, game);
  }
  return [...byId.values()];
}

/** Single game lookup — checks cache first, then targeted list scans */
export function useGame(gameId: number, seed?: Game) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: qk.game(gameId),
    queryFn: () => fetchGameById(gameId, queryClient),
    enabled: !!gameId,
    placeholderData: seed,
  });
}

/** Full list for merge picker and game select */
export function useGamesAll() {
  return useQuery({
    queryKey: qk.games({ source: 'all' }),
    queryFn: fetchAllGameSources,
  });
}

/** Paginated list for library grid */
export function useGamesPaginated(filter: GamesLibraryFilter) {
  return useInfiniteQuery({
    queryKey: [...qk.games(filter), 'pages'] as const,
    queryFn: ({ pageParam }) =>
      getGames({
        skip: pageParam,
        limit: GAMES_PAGE_SIZE,
        status: filter.status,
        inLibrary: filter.inLibrary,
        q: filter.q,
        sort: filter.sort,
        filter: filter.facet ?? undefined,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _all, lastPageParam) =>
      lastPage.items.length < GAMES_PAGE_SIZE ? undefined : lastPageParam + GAMES_PAGE_SIZE,
  });
}

export function useMergeGame(sourceId: number) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const pushToast = useToastStore((s) => s.pushToast);
  const invalidateGames = useGamesStore((s) => s.invalidate);

  return useMutation({
    mutationFn: (targetId: number) => adminMergeGame(sourceId, targetId),
    onSuccess: (_data, targetId) => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      invalidateGames();
      pushToast({ type: 'success', message: 'Gry połączone.' });
      navigate(`/library/${targetId}`);
    },
    onError: (err) => {
      const forbidden = axios.isAxiosError(err) && err.response?.status === 403;
      pushToast({
        type: 'error',
        message: forbidden ? 'Brak uprawnień do łączenia gier.' : 'Nie udało się połączyć gier.',
      });
    },
  });
}

export function useUpdateGamePreference(gameId: number) {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);
  const invalidateGames = useGamesStore((s) => s.invalidate);

  return useMutation({
    mutationFn: (pref: GamePreferenceUpdate) => upsertPreference(gameId, pref),
    onSuccess: (_data, pref) => {
      const patch = (game: Game) => (game.id === gameId ? applyGamePref(game, pref) : game);

      queryClient.setQueryData<Game>(qk.game(gameId), (old) => (old ? patch(old) : old));
      queryClient.setQueryData<Game[]>(qk.games({ source: 'all' }), (old) => old?.map(patch));

      queryClient.setQueriesData<InfiniteData<GameListResponse>>({ queryKey: ['games'] }, (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map(patch),
          })),
        };
      });

      queryClient.invalidateQueries({ queryKey: qk.gameStats(gameId) });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      invalidateGames();

      if (pref.is_accepted) {
        pushToast({ type: 'success', message: 'Gra zaakceptowana do biblioteki.' });
      } else if (pref.is_ignored) {
        pushToast({ type: 'success', message: 'Gra ignorowana w statystykach.' });
      } else {
        pushToast({ type: 'success', message: 'Gra przywrócona do biblioteki.' });
      }
    },
    onError: () => {
      pushToast({ type: 'error', message: 'Nie udało się zaktualizować preferencji.' });
    },
  });
}