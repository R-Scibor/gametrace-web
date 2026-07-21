import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach } from 'vitest';
import { GameDetailPage } from './GameDetailPage';
import { renderAppRoutes, resetStores } from '../../test/utils';
import { server } from '../../test/server';
import { fixtures } from '../../test/fixtures';
import { useLocalCoversStore } from '../store/localCoversStore';

beforeEach(() => {
  resetStores();
});

function renderGameDetail(gameId = 1) {
  return renderAppRoutes(
    <Route path="/library/:gameId" element={<GameDetailPage />} />,
    { route: `/library/${gameId}` },
  );
}

test('GameDetailPage deep link fetches GET /games/{id} without list scan', async () => {
  let getGameCalled = false;
  let listGamesCalled = false;

  server.use(
    http.get('/api/v1/games', () => {
      listGamesCalled = true;
      return HttpResponse.json({ total: 0, items: [] });
    }),
    http.get('/api/v1/games/:id', () => {
      getGameCalled = true;
      return HttpResponse.json(fixtures.gameNeedsReview);
    }),
  );

  renderAppRoutes(
    <Route path="/library/:gameId" element={<GameDetailPage />} />,
    { route: '/library/3' },
  );

  expect(await screen.findByRole('heading', { name: 'Nieznana Gra' })).toBeInTheDocument();
  expect(getGameCalled).toBe(true);
  expect(listGamesCalled).toBe(false);
});

test('GameDetailPage redirects to library on 404 game', async () => {
  server.use(
    http.get('/api/v1/games/:id', () =>
      HttpResponse.json({ detail: 'Game not found' }, { status: 404 }),
    ),
  );

  renderAppRoutes(
    <>
      <Route path="/library" element={<div data-testid="library">Biblioteka</div>} />
      <Route path="/library/:gameId" element={<GameDetailPage />} />
    </>,
    { route: '/library/999' },
  );

  expect(await screen.findByTestId('library')).toBeInTheDocument();
});

test('GameDetailPage renders game stats and session history', async () => {
  renderGameDetail();

  expect(await screen.findByRole('heading', { name: 'Wiedźmin 3' })).toBeInTheDocument();
  expect(screen.getByText('Historia sesji')).toBeInTheDocument();
  expect(screen.getByText('SESJE')).toBeInTheDocument();
});

test('GameDetailPage accept button calls preferences API for NEEDS_REVIEW game', async () => {
  let body: Record<string, unknown> | null = null;
  server.use(
    http.put('/api/v1/user/preferences/:id', async ({ request }) => {
      body = (await request.json()) as Record<string, unknown>;
      return new HttpResponse(null, { status: 204 });
    }),
  );

  const user = userEvent.setup();
  renderAppRoutes(
    <Route path="/library/:gameId" element={<GameDetailPage />} />,
    { route: '/library/3' },
  );

  await screen.findByRole('button', { name: /Zaakceptuj grę/i });
  await user.click(screen.getByRole('button', { name: /Zaakceptuj grę/i }));

  await waitFor(() => expect(body).toEqual({ is_ignored: false, is_accepted: true }));
});

test('GameDetailPage ignore toggle calls preferences API', async () => {
  let prefCalled = false;
  server.use(
    http.put('/api/v1/user/preferences/:id', () => {
      prefCalled = true;
      return new HttpResponse(null, { status: 204 });
    }),
  );

  const user = userEvent.setup();
  renderGameDetail();

  await screen.findByRole('heading', { name: 'Wiedźmin 3' });
  await user.click(screen.getByRole('button', { name: /Ignoruj grę/i }));

  await waitFor(() => expect(prefCalled).toBe(true));
  expect(screen.getByText('IGNOROWANA')).toBeInTheDocument();
});

test('GameDetailPage shows the global cover read-only, without an upload control', async () => {
  // Merge and global-cover-upload moved to the admin catalog panel; this page
  // is now read-only for both admins and regular users.
  renderGameDetail();
  await screen.findByRole('heading', { name: 'Wiedźmin 3' });
  expect(screen.queryByRole('button', { name: /Połącz z grą/i })).not.toBeInTheDocument();
  expect(screen.getByText('Okładka globalna')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /Wybierz globalną okładkę/i }),
  ).not.toBeInTheDocument();
});

test('GameDetailPage cover pick saves locally', async () => {
  const user = userEvent.setup();
  renderGameDetail();

  await screen.findByRole('button', { name: /Wybierz zdjęcie/i });

  const file = new File(['cover'], 'cover.png', { type: 'image/png' });
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;

  await user.upload(input, file);

  await waitFor(() => {
    expect(useLocalCoversStore.getState().covers[1]).toBeTruthy();
  });
  expect(screen.getByRole('button', { name: /Przywróć oryginalną/i })).toBeInTheDocument();
});