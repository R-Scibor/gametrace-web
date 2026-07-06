import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach } from 'vitest';
import { server } from '../../test/server';
import { AnalyticsPage } from './AnalyticsPage';
import { renderPage, resetStores } from '../../test/utils';

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