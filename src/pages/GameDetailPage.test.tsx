import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach } from 'vitest';
import { GameDetailPage } from './GameDetailPage';
import { renderAppRoutes, resetStores, seedAuth } from '../../test/utils';
import { server } from '../../test/server';
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

test('GameDetailPage merge dialog merges into target game', async () => {
  let mergeCalled = false;
  server.use(
    http.post('/api/v1/admin/games/:id/merge/:targetId', () => {
      mergeCalled = true;
      return new HttpResponse(null, { status: 204 });
    }),
  );

  const user = userEvent.setup();
  renderAppRoutes(
    <>
      <Route path="/library/2" element={<div data-testid="target-detail">Target</div>} />
      <Route path="/library/:gameId" element={<GameDetailPage />} />
    </>,
    { route: '/library/1' },
  );

  await screen.findByRole('heading', { name: 'Wiedźmin 3' });
  await user.click(screen.getByRole('button', { name: /Połącz z grą/i }));
  await user.click(screen.getByRole('button', { name: 'Cyberpunk 2077' }));
  const mergeDialog = screen.getByRole('dialog');
  await user.click(within(mergeDialog).getByRole('button', { name: /^POŁĄCZ$/i }));
  await user.click(screen.getAllByRole('button', { name: /^POŁĄCZ$/i }).at(-1)!);

  await waitFor(() => expect(mergeCalled).toBe(true));
  expect(await screen.findByTestId('target-detail')).toBeInTheDocument();
});

test('GameDetailPage hides merge action for non-admin users', async () => {
  resetStores();
  seedAuth(false);
  renderAppRoutes(
    <Route path="/library/:gameId" element={<GameDetailPage />} />,
    { route: '/library/1', authenticated: false },
  );

  await screen.findByRole('heading', { name: 'Wiedźmin 3' });
  expect(screen.queryByRole('button', { name: /Połącz z grą/i })).not.toBeInTheDocument();
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