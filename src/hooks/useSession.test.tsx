import { waitFor } from '@testing-library/react';
import { test, expect, beforeEach } from 'vitest';
import { useSession } from './useSession';
import { renderHookWithProviders, resetStores } from '../../test/utils';

beforeEach(() => {
  resetStores();
});

test('useSession fetches session by id', async () => {
  const { result } = renderHookWithProviders(() => useSession(1));

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.id).toBe(1);
  expect(result.current.data?.game_id).toBe(1);
});