import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, test } from 'vitest';
import { useGame } from './useGames';
import { createTestQueryClient, resetStores, seedAuth } from '../../test/utils';
import { qk } from '../lib/queryKeys';

beforeEach(() => {
  resetStores();
  seedAuth();
});

test('findGameInCache does not throw on a non-infinite entry under the games prefix', async () => {
  const client = createTestQueryClient();
  // getQueriesData({ queryKey: qk.gamesPrefix }) returns EVERY cache entry whose key
  // starts with 'games' — not just useGamesPaginated's InfiniteData<GameListResponse>.
  // useGameSuggest/useGameSearch populate plain, non-infinite shapes under the same
  // prefix (mirrored here). The old code cast every entry to InfiniteData and threw
  // on `.pages.flatMap` for shapes like this one.
  client.setQueryData(qk.gameSuggest('cyber'), { total: 0, items: [] });

  // Picker cache (qk.games({ source: 'picker' })) is empty too, so useGame must fall
  // through findGameInCache's second loop — the one that used to throw — before
  // falling back to the network for game id 3.
  const { result } = renderHook(() => useGame(3), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.id).toBe(3);
});
