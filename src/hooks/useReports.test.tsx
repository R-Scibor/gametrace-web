import { describe, it, expect, beforeEach } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { renderHookWithProviders, resetStores, seedAuth } from '../../test/utils';
import { useMergeCandidates, useSubmitReport } from './useReports';

describe('useReports', () => {
  beforeEach(() => {
    resetStores();
    seedAuth();
  });

  it('merges library + catalog results, drops the source game and sorts by name', async () => {
    const seen: string[] = [];
    server.use(
      http.get('/api/v1/games', ({ request }) => {
        const url = new URL(request.url);
        seen.push(url.search);
        const outside = url.searchParams.get('in_library') === 'false';
        const items = outside
          ? [
              { id: 3, primary_name: 'Celeste' },
              { id: 2, primary_name: 'Braid' },
            ]
          : [
              { id: 1, primary_name: 'Source' },
              { id: 2, primary_name: 'Braid' },
              { id: 4, primary_name: 'Antichamber' },
            ];
        return HttpResponse.json({ total: items.length, items });
      }),
    );
    const { result } = renderHookWithProviders(() => useMergeCandidates(1, '', 'en'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map((g) => g.id)).toEqual([4, 2, 3]);
    expect(seen).toHaveLength(2);
  });

  it('does not fetch while disabled', async () => {
    const { result } = renderHookWithProviders(() =>
      useMergeCandidates(1, '', 'en', { enabled: false }),
    );
    await new Promise((r) => setTimeout(r, 20));
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it('submits a report with message and context', async () => {
    let body: unknown;
    server.use(
      http.post('/api/v1/reports', async ({ request }) => {
        body = await request.json();
        return new HttpResponse(null, { status: 201 });
      }),
    );
    const { result } = renderHookWithProviders(() => useSubmitReport());
    const context = { screen: 'GameDetail', platform: 'web', osVersion: 'x', appVersion: '1' };
    await act(() => result.current.mutateAsync({ message: 'hi', context }));
    expect(body).toEqual({ message: 'hi', context });
  });

  it('exposes submit errors', async () => {
    server.use(http.post('/api/v1/reports', () => new HttpResponse(null, { status: 500 })));
    const { result } = renderHookWithProviders(() => useSubmitReport());
    act(() =>
      result.current.mutate({
        message: 'hi',
        context: { screen: 's', platform: 'web', osVersion: 'x', appVersion: '1' },
      }),
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
