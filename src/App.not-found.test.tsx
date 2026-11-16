import { screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import App from './App';
import { renderWithProviders, resetStores } from '../test/utils';

beforeEach(() => {
  resetStores();
});

test('full App: unknown path renders the 404 heading instead of the dashboard', async () => {
  renderWithProviders(<App />, { route: '/some-unknown-path', authenticated: true });

  await waitFor(() => {
    expect(screen.getByRole('heading', { level: 1, name: /nie znaleziono strony/i })).toBeInTheDocument();
  });
  expect(screen.queryByRole('heading', { level: 1, name: /pulpit/i })).not.toBeInTheDocument();
});

test('full App: unauthenticated unknown path renders the 404 heading instead of /welcome', async () => {
  renderWithProviders(<App />, { route: '/some-unknown-path', authenticated: false });

  await waitFor(() => {
    expect(screen.getByRole('heading', { level: 1, name: /nie znaleziono strony/i })).toBeInTheDocument();
  });
  expect(screen.queryByRole('heading', { name: /każda godzina gry/i })).not.toBeInTheDocument();
});
