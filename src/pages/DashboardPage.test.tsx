import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach } from 'vitest';
import { DashboardPage } from './DashboardPage';
import { renderPage, resetStores } from '../../test/utils';
import { server } from '../../test/server';
import { fixtures } from '../../test/fixtures';

beforeEach(() => {
  resetStores();
});

test('DashboardPage shows active session card and stat tiles', async () => {
  renderPage(<DashboardPage />, { route: '/' });

  expect(await screen.findByText('◈ GAMETRACE')).toBeInTheDocument();
  expect(await screen.findByText('AKTYWNA SESJA')).toBeInTheDocument();
  expect(screen.getAllByText('Wiedźmin 3').length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText('DZIŚ')).toBeInTheDocument();
  expect(screen.getByText('7 DNI')).toBeInTheDocument();
  expect(screen.getByText('ŚR. SESJA')).toBeInTheDocument();
  expect(screen.queryByText('30 DNI')).not.toBeInTheDocument();
});

test('DashboardPage shows last-played spotlight when idle', async () => {
  server.use(
    http.get('/api/v1/stats/dashboard', () => HttpResponse.json(fixtures.dashboardNoActive)),
  );

  renderPage(<DashboardPage />, { route: '/' });

  expect(await screen.findByText('◈ GAMETRACE')).toBeInTheDocument();
  expect(screen.queryByText('AKTYWNA SESJA')).not.toBeInTheDocument();
  expect(await screen.findByText('ŁĄCZNIE')).toBeInTheDocument();
  const gameLinks = screen.getAllByRole('link', { name: /Wiedźmin 3/i });
  expect(gameLinks.some((link) => link.getAttribute('href') === '/library/1')).toBe(true);
});

test('DashboardPage shows recent sessions', async () => {
  renderPage(<DashboardPage />, { route: '/' });

  expect(await screen.findByText('Ostatnie sesje')).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getAllByText('Wiedźmin 3').length).toBeGreaterThanOrEqual(1);
  });
});

test('DashboardPage shows pending errors banner', async () => {
  server.use(
    http.get('/api/v1/stats/dashboard', () =>
      HttpResponse.json({
        ...fixtures.dashboardNoActive,
        pending_errors: [
          {
            id: 2,
            game_id: 1,
            game_name: 'Wiedźmin 3',
            start_time: '2026-06-10T18:00:00Z',
            notes: null,
          },
        ],
      }),
    ),
  );

  renderPage(<DashboardPage />, { route: '/' });

  expect(await screen.findByText(/nieudana sesja wymaga uwagi/i)).toBeInTheDocument();
  expect(screen.getByText('NAPRAW →')).toBeInTheDocument();
});