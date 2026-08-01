import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createGame, matchGames, suggestGames } from '../api/games';
import { qk } from '../lib/queryKeys';
import { useGamesPicker } from './useGames';
import type {
  CreateGamePayload, Game, GameSuggestion, IGDBCandidate,
} from '../types/api';

const MAX_LOCAL_RESULTS = 50;
const SUGGEST_DEBOUNCE_MS = 250;

export type LadderMode = 'browse' | 'searching' | 'online' | 'error';

export interface LadderError {
  /** 'match' drives error mode; 'create' renders inline while mode stays 'online'. */
  scope: 'match' | 'create';
  /** i18n key in the `library` namespace, resolved by the caller. */
  key: string;
}

export interface SelectedGameMeta {
  id: number;
  primary_name: string;
  cover_image_url: string | null;
}

export type LadderPick =
  | { kind: 'library'; game: Game }
  | { kind: 'catalog'; suggestion: GameSuggestion }
  | { kind: 'candidate'; candidate: IGDBCandidate }
  | { kind: 'unrecognized' };

export interface GameLadder {
  query: string;
  setQuery: (next: string) => void;
  libraryMatches: Game[];
  catalogMatches: GameSuggestion[];
  /** The full, unfiltered picker list — not the dropdown's current (filtered, truncated) results. */
  pickerGames: Game[];
  isPickerLoading: boolean;
  isSuggesting: boolean;
  reset: () => void;
  mode: LadderMode;
  candidates: IGDBCandidate[];
  error: LadderError | null;
  searchOnline: () => void;
  selectedMeta: SelectedGameMeta | null;
  isCreating: boolean;
  /** Resolves to the selected game_id, or null if a create failed. */
  select: (pick: LadderPick) => Promise<number | null>;
}

export function useGameLadder(onResolved: (gameId: number) => void): GameLadder {
  const { data: pickerGames, isLoading: isPickerLoading } = useGamesPicker();
  const [query, setQueryState] = useState('');
  const [debounced, setDebounced] = useState('');

  const trimmed = query.trim();

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(trimmed), SUGGEST_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [trimmed]);

  // Keyed on the debounced string so a slow response for "had" lands in the "had"
  // cache entry while the component already renders the "hades" key. This is what
  // makes stale responses structurally impossible — do NOT replace with setState.
  const suggest = useQuery({
    queryKey: qk.gameSuggest(debounced),
    queryFn: () => suggestGames(debounced),
    enabled: debounced.length > 0,
    staleTime: 60_000,
  });

  const localMatches = useMemo(() => {
    const all = pickerGames ?? [];
    const q = trimmed.toLowerCase();
    const base = q ? all.filter((g) => g.primary_name.toLowerCase().includes(q)) : all;
    return base.slice(0, MAX_LOCAL_RESULTS);
  }, [pickerGames, trimmed]);

  const { libraryMatches, catalogMatches } = useMemo(() => {
    const items = debounced.length > 0 ? (suggest.data?.items ?? []) : [];
    const localIds = new Set(localMatches.map((g) => g.id));
    const pickerById = new Map((pickerGames ?? []).map((g) => [g.id, g]));

    // Owned games the substring filter missed but fuzzy suggest found: promote
    // into the library group rather than dropping them as duplicates.
    const promoted = items
      .filter((s) => !localIds.has(s.game_id) && pickerById.has(s.game_id))
      .map((s) => pickerById.get(s.game_id)!);

    return {
      libraryMatches: [...localMatches, ...promoted],
      catalogMatches: items.filter(
        (s) => !localIds.has(s.game_id) && !pickerById.has(s.game_id),
      ),
    };
  }, [suggest.data, debounced, localMatches, pickerGames]);

  const [mode, setMode] = useState<LadderMode>('browse');
  const [candidates, setCandidates] = useState<IGDBCandidate[]>([]);
  const [error, setError] = useState<LadderError | null>(null);

  const matchMut = useMutation({
    mutationFn: (q: string) => matchGames(q),
    onMutate: () => {
      setMode('searching');
      setCandidates([]);
      setError(null);
    },
    onSuccess: (list) => {
      // An empty list is a legitimate outcome, not an error: it is precisely the
      // case the unrecognized-create rung exists for.
      setCandidates(list);
      setMode('online');
    },
    onError: () => {
      setCandidates([]);
      setError({ scope: 'match', key: 'select.igdbUnavailable' });
      setMode('error');
    },
  });

  const searchOnline = useCallback(() => {
    if (!trimmed) return;
    matchMut.mutate(trimmed);
  }, [trimmed, matchMut]);

  const setQuery = useCallback(
    (next: string) => {
      // Only a change to the TRIMMED string invalidates an online search, so typing
      // a trailing space does not throw away candidates the user just paid for.
      if (next.trim() !== trimmed) {
        setMode('browse');
        setCandidates([]);
        setError(null);
      }
      setQueryState(next);
    },
    [trimmed],
  );

  const reset = useCallback(() => {
    setQueryState('');
    setDebounced('');
    setCandidates([]);
    setMode('browse');
    setError(null);
  }, []);

  const [selectedMeta, setSelectedMeta] = useState<SelectedGameMeta | null>(null);

  const createMut = useMutation({ mutationFn: createGame });

  const select = useCallback(
    async (pick: LadderPick): Promise<number | null> => {
      setError(null);

      let meta: SelectedGameMeta;
      if (pick.kind === 'library') {
        meta = {
          id: pick.game.id,
          primary_name: pick.game.primary_name,
          cover_image_url: pick.game.cover_image_url,
        };
      } else if (pick.kind === 'catalog') {
        meta = {
          id: pick.suggestion.game_id,
          primary_name: pick.suggestion.primary_name,
          cover_image_url: pick.suggestion.cover_image_url,
        };
      } else {
        if (!trimmed) return null;
        const payload: CreateGamePayload =
          pick.kind === 'candidate'
            ? { igdb_id: pick.candidate.igdb_id, query: trimmed }
            : { name: trimmed, unrecognized: true };
        try {
          const created = await createMut.mutateAsync(payload);
          // id and name only. is_ignored/is_accepted on this response are always
          // false/null regardless of the user's real prefs — never propagate them.
          meta = {
            id: created.id,
            primary_name: created.primary_name,
            cover_image_url: created.cover_image_url,
          };
        } catch {
          setError({ scope: 'create', key: 'select.createFailed' });
          return null;
        }
      }

      setSelectedMeta(meta);
      setQueryState('');
      setDebounced('');
      setCandidates([]);
      setMode('browse');
      onResolved(meta.id);
      return meta.id;
    },
    [trimmed, createMut, onResolved],
  );

  return {
    query,
    setQuery,
    libraryMatches,
    catalogMatches,
    pickerGames: pickerGames ?? [],
    isPickerLoading,
    isSuggesting: debounced.length > 0 && suggest.isFetching,
    reset,
    mode,
    candidates,
    error,
    searchOnline,
    selectedMeta,
    isCreating: createMut.isPending,
    select,
  };
}
