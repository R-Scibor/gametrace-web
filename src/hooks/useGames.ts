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
import { getGame, getGames, adminMergeGame } from '../api/games';
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
  const pickerList = queryClient.getQueryData<Game[]>(qk.games({ source: 'picker' }));
  const fromPicker = pickerList?.find((g) => g.id === gameId);
  if (fromPicker) return fromPicker;

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

  try {
    return await getGame(gameId);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

/** Backend caps GET /games at limit=100, so the picker pages through the library. */
export const GAME_PICKER_PAGE_SIZE = 100;
export const GAME_SEARCH_LIMIT = 20;

async function getAllGamesForPicker(): Promise<Game[]> {
  const all: Game[] = [];
  for (let skip = 0; ; skip += GAME_PICKER_PAGE_SIZE) {
    const page = await getGames({ skip, limit: GAME_PICKER_PAGE_SIZE, sort: 'name' });
    all.push(...page.items);
    if (all.length >= page.total || page.items.length < GAME_PICKER_PAGE_SIZE) break;
  }
  return all;
}

/** Single game lookup — cache first, then GET /games/{id} */
export function useGame(gameId: number, seed?: Game) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: qk.game(gameId),
    queryFn: () => fetchGameById(gameId, queryClient),
    enabled: !!gameId,
    placeholderData: seed,
  });
}

/** Sorted library list for session form game select (single request). */
export function useGamesPicker() {
  return useQuery({
    queryKey: qk.games({ source: 'picker' }),
    queryFn: getAllGamesForPicker,
    staleTime: 60_000,
  });
}

/** Server-side name search for merge target picker. */
export function useGameSearch(query: string, excludeId?: number) {
  return useQuery({
    queryKey: qk.games({ search: query, excludeId }),
    queryFn: () =>
      getGames({
        q: query || undefined,
        limit: GAME_SEARCH_LIMIT,
        sort: 'name',
      }),
    select: (data) => data.items.filter((g) => g.id !== excludeId),
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
      queryClient.setQueryData<Game[]>(qk.games({ source: 'picker' }), (old) => old?.map(patch));

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