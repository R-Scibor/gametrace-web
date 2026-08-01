import { act } from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, test, vi } from 'vitest';
import { useTranscribeVoice } from './useTranscribeVoice';
import { createTestQueryClient, resetStores, seedAuth } from '../../test/utils';
import { server } from '../../test/server';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
  );
}

function mockTranscribe(game: string | null) {
  server.use(
    http.post('/api/v1/voice/transcribe', () =>
      HttpResponse.json({
        game,
        date: null,
        start_time: null,
        end_time: null,
        duration_minutes: null,
        raw_transcript: '',
      }),
    ),
  );
}

beforeEach(() => {
  resetStores();
  seedAuth();
  navigateMock.mockClear();
});

test('resolve hit navigates with gameId and no gameName', async () => {
  // The shared handler resolves any name without "unknown" in it to game_id 1.
  mockTranscribe('Wiedźmin 3');

  const { result } = renderHook(() => useTranscribeVoice(), { wrapper });
  await act(async () => {
    await result.current.mutateAsync(new Blob());
  });

  expect(navigateMock).toHaveBeenCalledWith('/sessions/new?gameId=1');
});

test('resolve miss navigates with gameName and no gameId', async () => {
  // The shared handler resolves to null (a miss) for any name containing "unknown".
  mockTranscribe('Totally Unknown Game');

  const { result } = renderHook(() => useTranscribeVoice(), { wrapper });
  await act(async () => {
    await result.current.mutateAsync(new Blob());
  });

  expect(navigateMock).toHaveBeenCalledWith(
    '/sessions/new?gameName=Totally+Unknown+Game',
  );
});

test('resolve throwing still carries the transcribed title forward as gameName', async () => {
  // A name that WOULD resolve to a hit under the normal handler, so this test
  // isolates the throw path rather than accidentally re-testing the miss path.
  mockTranscribe('Wiedźmin 3');
  server.use(http.get('/api/v1/games/resolve', () => HttpResponse.error()));

  const { result } = renderHook(() => useTranscribeVoice(), { wrapper });
  await act(async () => {
    await result.current.mutateAsync(new Blob());
  });

  expect(navigateMock).toHaveBeenCalledWith('/sessions/new?gameName=Wied%C5%BAmin+3');
});
