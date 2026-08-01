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

  it('reset clears the query', async () => {
    const { result } = renderHook(() => useGameLadder(vi.fn()), { wrapper });
    act(() => result.current.setQuery('hades'));
    act(() => result.current.reset());
    expect(result.current.query).toBe('');
  });
});
