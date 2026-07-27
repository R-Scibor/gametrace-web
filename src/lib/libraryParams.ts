import type { GameSort, LibraryFilter } from '../types/api';
import i18n from '../i18n';

export const LIBRARY_SORT_KEY = 'library-sort';

const SORT_VALUES: GameSort[] = ['name', 'playtime', 'last_played'];

/** Runtime labels so language switches apply without a frozen module map. */
export function getGameSorts(): { key: GameSort; label: string }[] {
  return SORT_VALUES.map((key) => ({
    key,
    label: i18n.t(`library:sort.${key}`),
  }));
}

export function getFilterPrefix(type: LibraryFilter['type']): string {
  return i18n.t(`library:filterPrefix.${type}`);
}

const FACET_KEYS: LibraryFilter['type'][] = [
  'genre',
  'theme',
  'developer',
  'publisher',
  'release_decade',
];

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
