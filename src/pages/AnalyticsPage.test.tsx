import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach } from 'vitest';
import { server } from '../../test/server';
import { AnalyticsPage } from './AnalyticsPage';
import { LibraryPage } from './LibraryPage';
import { renderAppRoutes, renderPage, resetStores } from '../../test/utils';

beforeEach(() => {
  resetStores();
});

function periodButton(name: string) {
  return screen.getByRole('button', { name });
}

test('AnalyticsPage defaults to 7-day window', async () => {
  renderPage(<AnalyticsPage />, { route: '/analytics' });

  await screen.findByRole('group', { name: 'Okres' });
  expect(periodButton('7 DNI')).toHaveAttribute('aria-pressed', 'true');
});

test('AnalyticsPage renders stat panels', async () => {
  renderPage(<AnalyticsPage />, { route: '/analytics' });

  await screen.findByRole('group', { name: 'Okres' });
  await waitFor(() => {
    expect(screen.getByText('Przegląd')).toBeInTheDocument();
    expect(screen.getByText('ŚR. SESJA')).toBeInTheDocument();
    expect(screen.getByText('NOWE GRY')).toBeInTheDocument();
    expect(screen.getByText('Ranking gier')).toBeInTheDocument();
    expect(screen.getByText('Mapa aktywności')).toBeInTheDocument();
  });
});

test('AnalyticsPage window selector changes period', async () => {
  const user = userEvent.setup();
  renderPage(<AnalyticsPage />, { route: '/analytics' });

  await screen.findByRole('group', { name: 'Okres' });
  await user.click(periodButton('30 DNI'));

  expect(periodButton('30 DNI')).toHaveAttribute('aria-pressed', 'true');
  expect(periodButton('7 DNI')).toHaveAttribute('aria-pressed', 'false');
});

test('AnalyticsPage reads days from URL query', async () => {
  renderPage(<AnalyticsPage />, { route: '/analytics?days=90' });

  await screen.findByRole('group', { name: 'Okres' });
  expect(periodButton('90 DNI')).toHaveAttribute('aria-pressed', 'true');
});

test('AnalyticsPage genre bar drills into filtered library', async () => {
  const user = userEvent.setup();
  renderAppRoutes(
    <>
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/library" element={<LibraryPage />} />
    </>,
    { route: '/analytics' },
  );

  await screen.findByText('Gatunki');
  await waitFor(() => expect(screen.getByText('Adventure')).toBeInTheDocument());
  await user.click(screen.getByRole('button', { name: /Adventure/i }));

  expect(await screen.findByText('Gatunek: Adventure')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'CZAS GRY' })).toBeInTheDocument();
});

test('AnalyticsPage facet panels refetch when window changes', async () => {
  const user = userEvent.setup();
  renderPage(<AnalyticsPage />, { route: '/analytics' });

  await screen.findByText('Gatunki');
  await waitFor(() => expect(screen.getByText('Adventure')).toBeInTheDocument());
  expect(screen.queryByText('RPG')).not.toBeInTheDocument();

  await user.click(periodButton('30 DNI'));

  await waitFor(() => {
    expect(screen.getByText('RPG')).toBeInTheDocument();
    expect(screen.queryByText('Adventure')).not.toBeInTheDocument();
  });
});

test('AnalyticsPage supports all-time window', async () => {
  const user = userEvent.setup();
  renderPage(<AnalyticsPage />, { route: '/analytics' });

  await screen.findByRole('group', { name: 'Okres' });
  await user.click(periodButton('MAX'));

  expect(periodButton('MAX')).toHaveAttribute('aria-pressed', 'true');
  expect(await screen.findByText('w całym okresie')).toBeInTheDocument();
});

test('AnalyticsPage shows mobile parity insight tiles', async () => {
  renderPage(<AnalyticsPage />, { route: '/analytics' });

  expect(await screen.findByText('ŚR. SESJA')).toBeInTheDocument();
  expect(screen.getByText('NOWE GRY')).toBeInTheDocument();
  expect(screen.getByText('1.0')).toBeInTheDocument();
  expect(screen.getByText('2')).toBeInTheDocument();
});

test('AnalyticsPage shows comparison delta and longest session link', async () => {
  renderPage(<AnalyticsPage />, { route: '/analytics' });

  expect(await screen.findByText('↑20%')).toBeInTheDocument();
  const recordLink = screen.getByText('Rekord · najdłuższa sesja').closest('a');
  expect(recordLink).toHaveAttribute('href', '/library/1');
});

test('AnalyticsPage ranking rows link to game detail', async () => {
  renderPage(<AnalyticsPage />, { route: '/analytics' });

  await screen.findByText('Ranking gier');
  await waitFor(() => {
    const links = screen.getAllByRole('link');
    expect(links.some((link) => link.getAttribute('href') === '/library/2')).toBe(true);
  });
});

test('AnalyticsPage isolates panel errors', async () => {
  server.use(
    http.get('/api/v1/stats/heatmap', () =>
      HttpResponse.json({ detail: 'fail' }, { status: 500 }),
    ),
  );

  renderPage(<AnalyticsPage />, { route: '/analytics' });

  await screen.findByRole('group', { name: 'Okres' });
  await waitFor(() => {
    expect(screen.getByText('Przegląd')).toBeInTheDocument();
    expect(screen.getByText('Mapa aktywności')).toBeInTheDocument();
    expect(screen.getByText('BŁĄD POŁĄCZENIA')).toBeInTheDocument();
  });
});

test('AnalyticsPage shows the sample banner and disables day pills when the account has no stats', async () => {
  server.use(
    http.get('/api/v1/stats/summary', () =>
      HttpResponse.json({
        days: 7,
        window_start: null,
        window_end: '2026-07-23T00:00:00.000Z',
        total_seconds: 0,
        avg_session_seconds: 0,
        longest_session_seconds: 0,
        longest_session_game_id: null,
        longest_session_game_name: null,
        previous_total_seconds: 0,
        new_games_count: 0,
        per_game: [],
        pending_errors: [],
      }),
    ),
  );

  renderPage(<AnalyticsPage />, { route: '/analytics' });

  expect(await screen.findByText(/to są przykładowe dane/i)).toBeInTheDocument();
  expect(periodButton('7 DNI')).toBeDisabled();
});

test('AnalyticsPage hides the sample preview after dismissing the banner', async () => {
  const user = userEvent.setup();
  server.use(
    http.get('/api/v1/stats/summary', () =>
      HttpResponse.json({
        days: 7,
        window_start: null,
        window_end: '2026-07-23T00:00:00.000Z',
        total_seconds: 0,
        avg_session_seconds: 0,
        longest_session_seconds: 0,
        longest_session_game_id: null,
        longest_session_game_name: null,
        previous_total_seconds: 0,
        new_games_count: 0,
        per_game: [],
        pending_errors: [],
      }),
    ),
  );

  renderPage(<AnalyticsPage />, { route: '/analytics' });

  expect(await screen.findByText(/to są przykładowe dane/i)).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /ukryj podgląd/i }));

  expect(screen.queryByText(/to są przykładowe dane/i)).not.toBeInTheDocument();
  expect(periodButton('7 DNI')).not.toBeDisabled();
});

test('AnalyticsPage does not show the sample banner when stats have real data', async () => {
  renderPage(<AnalyticsPage />, { route: '/analytics' });
  await screen.findByRole('group', { name: 'Okres' });
  expect(screen.queryByText(/to są przykładowe dane/i)).not.toBeInTheDocument();
  expect(periodButton('7 DNI')).not.toBeDisabled();
});