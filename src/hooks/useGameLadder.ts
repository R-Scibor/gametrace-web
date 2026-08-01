import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { matchGames, suggestGames } from '../api/games';
import { qk } from '../lib/queryKeys';
import { useGamesPicker } from './useGames';
import type { Game, GameSuggestion, IGDBCandidate } from '../types/api';

const MAX_LOCAL_RESULTS = 50;
const SUGGEST_DEBOUNCE_MS = 250;

export type LadderMode = 'browse' | 'searching' | 'online' | 'error';

export interface LadderError {
  /** 'match' drives error mode; 'create' renders inline while mode stays 'online'. */
  scope: 'match' | 'create';
  /** i18n key in the `library` namespace, resolved by the caller. */
  key: string;
}

export interface GameLadder {
  query: string;
  setQuery: (next: string) => void;
  libraryMatches: Game[];
  catalogMatches: GameSuggestion[];
  isPickerLoading: boolean;
  isSuggesting: boolean;
  reset: () => void;
  mode: LadderMode;
  candidates: IGDBCandidate[];
  error: LadderError | null;
  searchOnline: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- _onResolved wired in Task 4
export function useGameLadder(_onResolved: (gameId: number) => void): GameLadder {
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

  return {
    query,
    setQuery,
    libraryMatches,
    catalogMatches,
    isPickerLoading,
    isSuggesting: debounced.length > 0 && suggest.isFetching,
    reset,
    mode,
    candidates,
    error,
    searchOnline,
  };
}
