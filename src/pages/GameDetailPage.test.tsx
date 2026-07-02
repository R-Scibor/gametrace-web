import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach } from 'vitest';
import { GameDetailPage } from './GameDetailPage';
import { renderAppRoutes, resetStores } from '../../test/utils';
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