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

test('AnalyticsPage defaults to 7-day window', async () => {
  renderPage(<AnalyticsPage />, { route: '/analytics' });

  const select = await screen.findByLabelText('Okres');
  expect((select as HTMLSelectElement).value).toBe('7');
});

test('AnalyticsPage renders stat panels', async () => {
  renderPage(<AnalyticsPage />, { route: '/analytics' });

  await screen.findByLabelText('Okres');
  await waitFor(() => {
    expect(screen.getByText('Łączny czas')).toBeInTheDocument();
    expect(screen.getByText('Ranking gier')).toBeInTheDocument();
    expect(screen.getByText('Mapa aktywności')).toBeInTheDocument();
    expect(screen.getByText('Passa')).toBeInTheDocument();
  });
});

test('AnalyticsPage window selector changes period', async () => {
  const user = userEvent.setup();
  renderPage(<AnalyticsPage />, { route: '/analytics' });

  const select = await screen.findByLabelText('Okres');
  await user.selectOptions(select, '7');

  expect((select as HTMLSelectElement).value).toBe('7');
});

test('AnalyticsPage reads days from URL query', async () => {
  renderPage(<AnalyticsPage />, { route: '/analytics?days=90' });

  const select = await screen.findByLabelText('Okres');
  expect((select as HTMLSelectElement).value).toBe('90');
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

  const select = screen.getByLabelText('Okres');
  await user.selectOptions(select, '30');

  await waitFor(() => {
    expect(screen.getByText('RPG')).toBeInTheDocument();
    expect(screen.queryByText('Adventure')).not.toBeInTheDocument();
  });
});

test('AnalyticsPage supports all-time window', async () => {
  const user = userEvent.setup();
  renderPage(<AnalyticsPage />, { route: '/analytics' });

  const select = await screen.findByLabelText('Okres');
  await user.selectOptions(select, '0');

  expect((select as HTMLSelectElement).value).toBe('0');
  expect(await screen.findByText('w całym okresie')).toBeInTheDocument();
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

  await screen.findByLabelText('Okres');
  await waitFor(() => {
    expect(screen.getByText('Łączny czas')).toBeInTheDocument();
    expect(screen.getByText('Mapa aktywności')).toBeInTheDocument();
    expect(screen.getByText('BŁĄD POŁĄCZENIA')).toBeInTheDocument();
  });
});