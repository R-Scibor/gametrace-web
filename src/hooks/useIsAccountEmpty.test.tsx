import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach } from 'vitest';
import { useIsAccountEmpty } from './useIsAccountEmpty';
import { renderHookWithProviders, resetStores } from '../../test/utils';
import { server } from '../../test/server';
import { fixtures } from '../../test/fixtures';

beforeEach(() => {
  resetStores();
});

test('isEmpty is false while loading', () => {
  const { result } = renderHookWithProviders(() => useIsAccountEmpty());
  expect(result.current.isEmpty).toBe(false);
});

test('isEmpty is true once settled with no active session and no recents', async () => {
  server.use(
    http.get('/api/v1/stats/dashboard', () => HttpResponse.json(fixtures.dashboardNoActive)),
    http.get('/api/v1/sessions', () => HttpResponse.json([])),
  );

  const { result } = renderHookWithProviders(() => useIsAccountEmpty());

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
  expect(result.current.isEmpty).toBe(true);
});

test('isEmpty is false once settled with real recent sessions', async () => {
  const { result } = renderHookWithProviders(() => useIsAccountEmpty());

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
  expect(result.current.isEmpty).toBe(false);
});
