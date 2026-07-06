import { test, expect, beforeEach } from 'vitest';
import {
  clearFacetParams,
  libraryDrillUrl,
  parseFacetFilter,
  parseLibrarySort,
} from './libraryParams';

beforeEach(() => {
  sessionStorage.clear();
});

test('parseFacetFilter reads the first facet param', () => {
  const params = new URLSearchParams('genre=RPG&sort=playtime');
  expect(parseFacetFilter(params)).toEqual({ type: 'genre', value: 'RPG' });
});

test('parseLibrarySort prefers URL then sessionStorage', () => {
  sessionStorage.setItem('library-sort', 'last_played');
  expect(parseLibrarySort(new URLSearchParams())).toBe('last_played');
  expect(parseLibrarySort(new URLSearchParams('sort=playtime'))).toBe('playtime');
});

test('libraryDrillUrl builds playtime-sorted library link', () => {
  expect(libraryDrillUrl('genre', 'Adventure')).toBe('/library?genre=Adventure&sort=playtime');
});

test('clearFacetParams removes facet keys only', () => {
  const next = clearFacetParams(new URLSearchParams('genre=RPG&sort=playtime&q=witch'));
  expect(next.get('genre')).toBeNull();
  expect(next.get('sort')).toBe('playtime');
  expect(next.get('q')).toBe('witch');
});