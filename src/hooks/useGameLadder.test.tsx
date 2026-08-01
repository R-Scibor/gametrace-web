import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameLadder } from './useGameLadder';
import { createTestQueryClient, resetStores, seedAuth } from '../../test/utils';
import { QueryClientProvider } from '@tanstack/react-query';

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  resetStores();
  seedAuth();
});

describe('useGameLadder browse rung', () => {
  it('filters the picker list locally with no network call', async () => {
    const { result } = renderHook(() => useGameLadder(vi.fn()), { wrapper });
    await waitFor(() => expect(result.current.isPickerLoading).toBe(false));

    act(() => result.current.setQuery('Cyber'));

    expect(result.current.libraryMatches.map((g) => g.primary_name)).toEqual([
      'Cyberpunk 2077',
    ]);
  });

  it('exposes suggest results absent from the library as catalogMatches', async () => {
    const { result } = renderHook(() => useGameLadder(vi.fn()), { wrapper });
    await waitFor(() => expect(result.current.isPickerLoading).toBe(false));

    act(() => result.current.setQuery('hades'));

    await waitFor(() =>
      expect(result.current.catalogMatches.map((s) => s.game_id)).toEqual([901]),
    );
  });

  it('does not query suggest for whitespace-only input', async () => {
    const { result } = renderHook(() => useGameLadder(vi.fn()), { wrapper });
    await waitFor(() => expect(result.current.isPickerLoading).toBe(false));

    act(() => result.current.setQuery('   '));

    await waitFor(() => expect(result.current.isSuggesting).toBe(false));
    expect(result.current.catalogMatches).toEqual([]);
  });

  it('promotes an owned game the substring filter missed into libraryMatches', async () => {
    const { result } = renderHook(() => useGameLadder(vi.fn()), { wrapper });
    await waitFor(() => expect(result.current.isPickerLoading).toBe(false));

    act(() => result.current.setQuery('witcher'));

    // "witcher" substring-matches nothing in the library, so this game can only
    // arrive via the promote branch.
    await waitFor(() =>
      expect(result.current.libraryMatches.map((g) => g.id)).toContain(1),
    );
    // And it must NOT be offered as a catalog suggestion — the user owns it.
    expect(result.current.catalogMatches).toEqual([]);
  });

  it('reset clears the query', async () => {
    const { result } = renderHook(() => useGameLadder(vi.fn()), { wrapper });
    act(() => result.current.setQuery('hades'));
    act(() => result.current.reset());
    expect(result.current.query).toBe('');
  });
});

describe('useGameLadder online rung', () => {
  it('starts in browse mode and never matches on typing', async () => {
    const { result } = renderHook(() => useGameLadder(vi.fn()), { wrapper });
    await waitFor(() => expect(result.current.isPickerLoading).toBe(false));

    act(() => result.current.setQuery('kingdom hearts'));
    await waitFor(() => expect(result.current.isSuggesting).toBe(false));

    expect(result.current.mode).toBe('browse');
    expect(result.current.candidates).toEqual([]);
  });

  it('searchOnline enters online mode with candidates', async () => {
    const { result } = renderHook(() => useGameLadder(vi.fn()), { wrapper });
    await waitFor(() => expect(result.current.isPickerLoading).toBe(false));

    act(() => result.current.setQuery('kingdom hearts'));
    act(() => result.current.searchOnline());

    await waitFor(() => expect(result.current.mode).toBe('online'));
    expect(result.current.candidates[0].igdb_id).toBe(11142);
  });

  it('treats an empty match result as online, not error', async () => {
    const { result } = renderHook(() => useGameLadder(vi.fn()), { wrapper });
    await waitFor(() => expect(result.current.isPickerLoading).toBe(false));

    act(() => result.current.setQuery('no-online-results'));
    act(() => result.current.searchOnline());

    await waitFor(() => expect(result.current.mode).toBe('online'));
    expect(result.current.candidates).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('enters error mode on a match 503', async () => {
    const { result } = renderHook(() => useGameLadder(vi.fn()), { wrapper });
    await waitFor(() => expect(result.current.isPickerLoading).toBe(false));

    act(() => result.current.setQuery('igdb-down'));
    act(() => result.current.searchOnline());

    await waitFor(() => expect(result.current.mode).toBe('error'));
    expect(result.current.error).toEqual({
      scope: 'match',
      key: 'select.igdbUnavailable',
    });
  });

  it('returns to browse and clears candidates when the query changes', async () => {
    const { result } = renderHook(() => useGameLadder(vi.fn()), { wrapper });
    await waitFor(() => expect(result.current.isPickerLoading).toBe(false));

    act(() => result.current.setQuery('kingdom hearts'));
    act(() => result.current.searchOnline());
    await waitFor(() => expect(result.current.mode).toBe('online'));

    act(() => result.current.setQuery('kingdom hearts 2'));

    expect(result.current.mode).toBe('browse');
    expect(result.current.candidates).toEqual([]);
  });

  it('does not leave online mode when only surrounding whitespace changes', async () => {
    const { result } = renderHook(() => useGameLadder(vi.fn()), { wrapper });
    await waitFor(() => expect(result.current.isPickerLoading).toBe(false));

    act(() => result.current.setQuery('kingdom hearts'));
    act(() => result.current.searchOnline());
    await waitFor(() => expect(result.current.mode).toBe('online'));

    act(() => result.current.setQuery('kingdom hearts '));

    expect(result.current.mode).toBe('online');
  });
});

describe('useGameLadder selection', () => {
  it('selects a library game and reports the id', async () => {
    const onResolved = vi.fn();
    const { result } = renderHook(() => useGameLadder(onResolved), { wrapper });
    await waitFor(() => expect(result.current.isPickerLoading).toBe(false));

    const game = result.current.libraryMatches[0];
    await act(async () => { await result.current.select({ kind: 'library', game }); });

    expect(onResolved).toHaveBeenCalledWith(game.id);
    expect(result.current.selectedMeta?.primary_name).toBe(game.primary_name);
  });

  it('records a catalog pick that is absent from the picker list', async () => {
    const onResolved = vi.fn();
    const { result } = renderHook(() => useGameLadder(onResolved), { wrapper });
    await waitFor(() => expect(result.current.isPickerLoading).toBe(false));

    act(() => result.current.setQuery('hades'));
    await waitFor(() => expect(result.current.catalogMatches).toHaveLength(1));

    const suggestion = result.current.catalogMatches[0];
    await act(async () => {
      await result.current.select({ kind: 'catalog', suggestion });
    });

    expect(onResolved).toHaveBeenCalledWith(901);
    expect(result.current.selectedMeta).toEqual({
      id: 901,
      primary_name: 'Hades',
      cover_image_url: null,
    });
  });

  it('creates from an IGDB candidate and sends the original query as an alias', async () => {
    const onResolved = vi.fn();
    const { result } = renderHook(() => useGameLadder(onResolved), { wrapper });
    await waitFor(() => expect(result.current.isPickerLoading).toBe(false));

    act(() => result.current.setQuery('kingdom hearts'));
    act(() => result.current.searchOnline());
    await waitFor(() => expect(result.current.mode).toBe('online'));

    const candidate = result.current.candidates[0];
    await act(async () => {
      await result.current.select({ kind: 'candidate', candidate });
    });

    expect(onResolved).toHaveBeenCalledWith(902);
    expect(result.current.selectedMeta?.id).toBe(902);
    expect(result.current.query).toBe('');
    expect(result.current.mode).toBe('browse');
  });

  it('creates an unrecognized game from the trimmed query', async () => {
    const onResolved = vi.fn();
    const { result } = renderHook(() => useGameLadder(onResolved), { wrapper });
    await waitFor(() => expect(result.current.isPickerLoading).toBe(false));

    act(() => result.current.setQuery('  My Tiny Jam Game  '));
    act(() => result.current.searchOnline());
    await waitFor(() => expect(result.current.mode).toBe('online'));

    await act(async () => { await result.current.select({ kind: 'unrecognized' }); });

    expect(onResolved).toHaveBeenCalledWith(903);
    expect(result.current.selectedMeta?.primary_name).toBe('My Tiny Jam Game');
  });

  it('reports a create failure inline and preserves the query', async () => {
    const onResolved = vi.fn();
    const { result } = renderHook(() => useGameLadder(onResolved), { wrapper });
    await waitFor(() => expect(result.current.isPickerLoading).toBe(false));

    act(() => result.current.setQuery('create-fails'));
    act(() => result.current.searchOnline());
    await waitFor(() => expect(result.current.mode).toBe('online'));

    await act(async () => { await result.current.select({ kind: 'unrecognized' }); });

    expect(onResolved).not.toHaveBeenCalled();
    expect(result.current.error).toEqual({
      scope: 'create',
      key: 'select.createFailed',
    });
    expect(result.current.query).toBe('create-fails');
    expect(result.current.mode).toBe('online');
  });
});
