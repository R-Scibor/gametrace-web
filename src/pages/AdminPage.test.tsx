import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach } from 'vitest';
import { AdminPage } from './AdminPage';
import { useToastStore } from '../store/toastStore';
import { renderPage, resetStores } from '../../test/utils';
import { server } from '../../test/server';
import { fixtures } from '../../test/fixtures';

beforeEach(() => {
  resetStores();
});

test('AdminPage shows Operacje sub-nav as active', () => {
  renderPage(<AdminPage />, { route: '/admin' });
  expect(screen.getByRole('link', { name: 'Operacje' })).toHaveAttribute('aria-current', 'page');
});

test('AdminPage search selects game and shows ops panel', async () => {
  const user = userEvent.setup();
  renderPage(<AdminPage />);

  await user.type(screen.getByLabelText('Szukaj gry'), 'Wiedźmin');
  expect(await screen.findByRole('button', { name: /Wiedźmin 3/i })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Wiedźmin 3/i }));

  expect(await screen.findByRole('heading', { name: 'Wiedźmin 3' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Połącz z grą/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Wybierz globalną okładkę/i })).toBeInTheDocument();
});

test('AdminPage ID lookup shows error on 404', async () => {
  server.use(
    http.get('/api/v1/games/:id', () =>
      HttpResponse.json({ detail: 'Game not found' }, { status: 404 }),
    ),
  );

  const user = userEvent.setup();
  renderPage(<AdminPage />);

  await user.type(screen.getByLabelText('ID gry'), '999');
  await user.click(screen.getByRole('button', { name: /^SZUKAJ$/i }));

  expect(await screen.findByText('Nie znaleziono gry.')).toBeInTheDocument();
});

test('AdminPage global cover upload calls admin endpoint', async () => {
  let coverCalled = false;
  server.use(
    http.put('/api/v1/admin/games/:id/cover', async () => {
      coverCalled = true;
      return HttpResponse.json({
        ...fixtures.game,
        cover_image_url: '/covers/1.jpg',
        cover_source: 'CUSTOM',
      });
    }),
  );

  const user = userEvent.setup();
  renderPage(<AdminPage />);

  await user.type(screen.getByLabelText('Szukaj gry'), 'Wiedźmin');
  await user.click(await screen.findByRole('button', { name: /Wiedźmin 3/i }));

  const file = new File(['cover'], 'cover.png', { type: 'image/png' });
  await user.click(screen.getByRole('button', { name: /Wybierz globalną okładkę/i }));
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await user.upload(input, file);

  await waitFor(() => expect(coverCalled).toBe(true));
  await waitFor(() => {
    expect(
      useToastStore.getState().toasts.some((t) => t.message === 'Globalna okładka zapisana.'),
    ).toBe(true);
  });
});