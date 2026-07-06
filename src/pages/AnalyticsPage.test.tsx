import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, beforeEach } from 'vitest';
import { AnalyticsPage } from './AnalyticsPage';
import { renderPage, resetStores } from '../../test/utils';

beforeEach(() => {
  resetStores();
});

test('AnalyticsPage defaults to 7-day window', async () => {
  renderPage(<AnalyticsPage />, { route: '/analytics' });

  await screen.findByRole('heading', { name: 'Statystyki' });
  expect((screen.getByLabelText('Okres') as HTMLSelectElement).value).toBe('7');
});

test('AnalyticsPage renders stat panels', async () => {
  renderPage(<AnalyticsPage />, { route: '/analytics' });

  expect(await screen.findByRole('heading', { name: 'Statystyki' })).toBeInTheDocument();
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

  await screen.findByRole('heading', { name: 'Statystyki' });
  const select = screen.getByLabelText('Okres');
  await user.selectOptions(select, '7');

  expect((select as HTMLSelectElement).value).toBe('7');
});

test('AnalyticsPage reads days from URL query', async () => {
  renderPage(<AnalyticsPage />, { route: '/analytics?days=90' });

  await screen.findByRole('heading', { name: 'Statystyki' });
  expect((screen.getByLabelText('Okres') as HTMLSelectElement).value).toBe('90');
});