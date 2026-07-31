import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach } from 'vitest';
import { LibraryPage } from './LibraryPage';
import { createTestQueryClient, renderPage, resetStores, seedAuth } from '../../test/utils';
import { server } from '../../test/server';
import { SAMPLE_GAMES } from '../lib/sampleData';

beforeEach(() => {
  resetStores();
});

test('LibraryPage shows error banner with retry on fetch failure', async () => {
  server.use(
    http.get('/api/v1/games', () => HttpResponse.json({ detail: 'fail' }, { status: 500 })),
  );

  renderPage(<LibraryPage />, { route: '/library' });

  expect(await screen.findByText('Błąd ładowania biblioteki.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Spróbuj ponownie/i })).toBeInTheDocument();
});

test('LibraryPage renders main library games by default', async () => {
  renderPage(<LibraryPage />, { route: '/library' });

  expect(await screen.findByText('Biblioteka')).toBeInTheDocument();
  expect(await screen.findByText('Wiedźmin 3')).toBeInTheDocument();
  expect(screen.getByText('Cyberpunk 2077')).toBeInTheDocument();
  expect(screen.queryByText('Nieznana Gra')).not.toBeInTheDocument();
});

test('LibraryPage search queries server with debounce', async () => {
  const user = userEvent.setup();
  renderPage(<LibraryPage />, { route: '/library' });

  await screen.findByText('Wiedźmin 3');
  await user.type(screen.getByLabelText('Szukaj gry'), 'Cyber');

  await waitFor(
    () => {
      expect(screen.getByText('Cyberpunk 2077')).toBeInTheDocument();
      expect(screen.queryByText('Wiedźmin 3')).not.toBeInTheDocument();
    },
    { timeout: 5000 },
  );
});

test('LibraryPage review tab shows only NEEDS_REVIEW games', async () => {
  const user = userEvent.setup();
  renderPage(<LibraryPage />, { route: '/library' });

  await screen.findByText('Wiedźmin 3');
  await user.click(screen.getByRole('button', { name: 'Do sprawdzenia' }));

  await waitFor(() => {
    expect(screen.getByText('Nieznana Gra')).toBeInTheDocument();
  });
  expect(screen.queryByText('Wiedźmin 3')).not.toBeInTheDocument();
});

test('LibraryPage playtime sort shows duration on cards', async () => {
  const user = userEvent.setup();
  renderPage(<LibraryPage />, { route: '/library' });

  await screen.findByText('Wiedźmin 3');
  await user.click(screen.getByRole('button', { name: 'CZAS GRY' }));

  expect(await screen.findByText('4h 0m')).toBeInTheDocument();
});

test('LibraryPage facet drill resets tab to all from review', async () => {
  const user = userEvent.setup();
  seedAuth();
  const router = createMemoryRouter([{ path: '/library', element: <LibraryPage /> }], {
    initialEntries: ['/library'],
  });

  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  await screen.findByText('Wiedźmin 3');
  await user.click(screen.getByRole('button', { name: 'Do sprawdzenia' }));
  await waitFor(() => expect(screen.getByText('Nieznana Gra')).toBeInTheDocument());

  await router.navigate('/library?genre=RPG&sort=playtime');

  expect(await screen.findByText('Gatunek: RPG')).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getByText('Wiedźmin 3')).toBeInTheDocument();
    expect(screen.queryByText('Nieznana Gra')).not.toBeInTheDocument();
  });
});

test('LibraryPage facet URL shows chip and filters games', async () => {
  renderPage(<LibraryPage />, { route: '/library?genre=RPG&sort=playtime' });

  expect(await screen.findByText('Gatunek: RPG')).toBeInTheDocument();
  expect(await screen.findByText('Wiedźmin 3')).toBeInTheDocument();
  expect(screen.getByText('Cyberpunk 2077')).toBeInTheDocument();
});

test('LibraryPage dismisses facet chip', async () => {
  const user = userEvent.setup();
  renderPage(<LibraryPage />, { route: '/library?developer=CD%20Projekt%20Red' });

  await screen.findByText('Deweloper: CD Projekt Red');
  await user.click(screen.getByRole('button', { name: 'Wyczyść filtr' }));

  await waitFor(() => {
    expect(screen.queryByText(/Deweloper:/)).not.toBeInTheDocument();
  });
});

test('LibraryPage other tab shows out-of-library games', async () => {
  const user = userEvent.setup();
  renderPage(<LibraryPage />, { route: '/library' });

  await screen.findByText('Wiedźmin 3');
  await user.click(screen.getByRole('button', { name: 'Inne' }));

  await waitFor(() => {
    expect(screen.getByText('Stara Gra')).toBeInTheDocument();
  });
  expect(screen.queryByText('Wiedźmin 3')).not.toBeInTheDocument();
});

test('LibraryPage shows sample games for an empty unfiltered library', async () => {
  server.use(
    http.get('/api/v1/games', () => HttpResponse.json({ total: 0, items: [] })),
  );

  renderPage(<LibraryPage />, { route: '/library' });

  expect(await screen.findByText(/to są przykładowe dane/i)).toBeInTheDocument();
  expect(screen.getByText(SAMPLE_GAMES[0].primary_name)).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: new RegExp(SAMPLE_GAMES[0].primary_name) })).not.toBeInTheDocument();
});

test('LibraryPage hides the sample preview after dismissing the banner', async () => {
  const user = userEvent.setup();
  server.use(
    http.get('/api/v1/games', () => HttpResponse.json({ total: 0, items: [] })),
  );

  renderPage(<LibraryPage />, { route: '/library' });

  expect(await screen.findByText(/to są przykładowe dane/i)).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /ukryj przykładowe/i }));

  expect(screen.queryByText(/to są przykładowe dane/i)).not.toBeInTheDocument();
  expect(screen.queryByText(SAMPLE_GAMES[0].primary_name)).not.toBeInTheDocument();
});

test('LibraryPage keeps the plain empty state for a filtered search with no results', async () => {
  server.use(
    http.get('/api/v1/games', () => HttpResponse.json({ total: 0, items: [] })),
  );

  renderPage(<LibraryPage />, { route: '/library' });

  const search = await screen.findByPlaceholderText('Szukaj gry...');
  await import('@testing-library/user-event').then(({ default: userEvent }) =>
    userEvent.type(search, 'nieistniejąca gra'),
  );

  expect(await screen.findByText(/brak wyników dla/i)).toBeInTheDocument();
  expect(screen.queryByText(/to są przykładowe dane/i)).not.toBeInTheDocument();
});