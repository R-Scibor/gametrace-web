import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach } from 'vitest';
import { TrashPage } from './TrashPage';
import { renderPage, resetStores } from '../../test/utils';
import { server } from '../../test/server';
import { fixtures } from '../../test/fixtures';

beforeEach(() => {
  resetStores();
});

test('TrashPage renders trashed sessions', async () => {
  renderPage(<TrashPage />, { route: '/trash' });

  expect(await screen.findByText('Kosz')).toBeInTheDocument();
  expect(await screen.findByText('Wiedźmin 3')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Przywróć/i })).toBeInTheDocument();
});

test('TrashPage restore 409 shows ConflictNotice', async () => {
  server.use(
    http.post('/api/v1/sessions/:id/restore', () =>
      HttpResponse.json({ detail: fixtures.conflictResponse }, { status: 409 }),
    ),
  );

  const user = userEvent.setup();
  renderPage(<TrashPage />, { route: '/trash' });

  await screen.findByText('Wiedźmin 3');
  await user.click(screen.getByRole('button', { name: /Przywróć/i }));

  expect(await screen.findByText('Nakładające się sesje')).toBeInTheDocument();
});

test('TrashPage hard-delete confirms and removes session', async () => {
  let deleted = false;
  server.use(
    http.get('/api/v1/sessions/trash', () =>
      HttpResponse.json(deleted ? [] : fixtures.trash),
    ),
    http.delete('/api/v1/sessions/:id', ({ request }) => {
      const url = new URL(request.url);
      if (url.searchParams.get('hard') === 'true') {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }
      return new HttpResponse(null, { status: 204 });
    }),
  );

  const user = userEvent.setup();
  renderPage(<TrashPage />, { route: '/trash' });

  await screen.findByText('Wiedźmin 3');
  const deleteButtons = screen.getAllByRole('button', { name: /Usuń trwale/i });
  await user.click(deleteButtons[0]);

  const dialog = await screen.findByRole('alertdialog');
  await user.click(within(dialog).getByRole('button', { name: 'USUŃ TRWALE' }));

  await waitFor(() => {
    expect(screen.getByText('Kosz jest pusty.')).toBeInTheDocument();
  });
});