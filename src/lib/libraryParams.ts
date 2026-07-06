import type { GameSort, LibraryFilter } from '../types/api';

export const LIBRARY_SORT_KEY = 'library-sort';

export const GAME_SORTS: { key: GameSort; label: string }[] = [
  { key: 'name', label: 'NAZWA' },
  { key: 'playtime', label: 'CZAS GRY' },
  { key: 'last_played', label: 'OSTATNIO GRANE' },
];

export const FILTER_PREFIX: Record<LibraryFilter['type'], string> = {
  genre: 'Gatunek',
  theme: 'Motyw',
  developer: 'Deweloper',
  publisher: 'Wydawca',
  release_decade: 'Dekada',
};

const FACET_KEYS: LibraryFilter['type'][] = [
  'genre',
  'theme',
  'developer',
  'publisher',
  'release_decade',
];

const SORT_VALUES: GameSort[] = ['name', 'playtime', 'last_played'];

export function parseFacetFilter(params: URLSearchParams): LibraryFilter | null {
  for (const type of FACET_KEYS) {
    const value = params.get(type);
    if (value) return { type, value };
  }
  return null;
}

export function parseLibrarySort(params: URLSearchParams): GameSort {
  const fromUrl = params.get('sort');
  if (fromUrl && SORT_VALUES.includes(fromUrl as GameSort)) {
    return fromUrl as GameSort;
  }
  try {
    const stored = sessionStorage.getItem(LIBRARY_SORT_KEY);
    if (stored && SORT_VALUES.includes(stored as GameSort)) {
      return stored as GameSort;
    }
  } catch {
    // sessionStorage unavailable
  }
  return 'name';
}

export function persistLibrarySort(sort: GameSort) {
  try {
    sessionStorage.setItem(LIBRARY_SORT_KEY, sort);
  } catch {
    // ignore
  }
}

export function clearFacetParams(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const key of FACET_KEYS) next.delete(key);
  return next;
}

export function libraryDrillUrl(type: LibraryFilter['type'], value: string): string {
  const params = new URLSearchParams();
  params.set(type, value);
  params.set('sort', 'playtime');
  return `/library?${params.toString()}`;
}