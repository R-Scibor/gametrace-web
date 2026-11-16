import { test, expect, beforeEach } from 'vitest';
import {
  clearFacetParams,
  getDefaultSortOrder,
  libraryDrillUrl,
  parseFacetFilter,
  parseLibraryCoversOnly,
  parseLibraryOrder,
  parseLibrarySort,
  persistLibraryCoversOnly,
} from './libraryParams';

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
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

test('parseLibraryCoversOnly reads from localStorage and falls back to false', () => {
  expect(parseLibraryCoversOnly()).toBe(false);
  persistLibraryCoversOnly(true);
  expect(parseLibraryCoversOnly()).toBe(true);
  persistLibraryCoversOnly(false);
  expect(parseLibraryCoversOnly()).toBe(false);
});

test('getDefaultSortOrder returns asc for name and desc for playtime and last_played', () => {
  expect(getDefaultSortOrder('name')).toBe('asc');
  expect(getDefaultSortOrder('playtime')).toBe('desc');
  expect(getDefaultSortOrder('last_played')).toBe('desc');
});

test('parseLibraryOrder extracts order param from URL when valid', () => {
  expect(parseLibraryOrder(new URLSearchParams('order=asc'))).toBe('asc');
  expect(parseLibraryOrder(new URLSearchParams('order=desc'))).toBe('desc');
  expect(parseLibraryOrder(new URLSearchParams('order=other'))).toBeUndefined();
  expect(parseLibraryOrder(new URLSearchParams())).toBeUndefined();
});