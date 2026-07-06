import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach } from 'vitest';
import { useHardDeleteSession } from './useHardDeleteSession';
import { renderHookWithProviders, resetStores } from '../../test/utils';
import { server } from '../../test/server';

beforeEach(() => {
  resetStores();
});

test('useHardDeleteSession calls hard delete endpoint', async () => {
  let hardDeleteCalled = false;
  server.use(
    http.delete('/api/v1/sessions/:id', ({ request }) => {
      const url = new URL(request.url);
      if (url.searchParams.get('hard') === 'true') hardDeleteCalled = true;
      return new HttpResponse(null, { status: 204 });
    }),
  );

  const { result } = renderHookWithProviders(() => useHardDeleteSession());
  result.current.mutate(10);

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(hardDeleteCalled).toBe(true);
});