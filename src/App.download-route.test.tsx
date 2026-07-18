import { screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import App from './App';
import { renderWithProviders, resetStores } from '../test/utils';

beforeEach(() => {
  resetStores();
});

test('full App: unauthenticated /download stays on download hub (not /welcome)', async () => {
  renderWithProviders(<App />, { route: '/download', authenticated: false });

  await waitFor(() => {
    expect(screen.getByRole('heading', { level: 1, name: /pobierz aplikację/i })).toBeInTheDocument();
  });
  expect(screen.queryByRole('heading', { name: /dziennik rozgrywek/i })).not.toBeInTheDocument();
});

test('full App: unauthenticated /download/ stays on download hub (not /welcome)', async () => {
  renderWithProviders(<App />, { route: '/download/', authenticated: false });

  await waitFor(() => {
    expect(screen.getByRole('heading', { level: 1, name: /pobierz aplikację/i })).toBeInTheDocument();
  });
  expect(screen.queryByRole('heading', { name: /dziennik rozgrywek/i })).not.toBeInTheDocument();
});

test('full App: unauthenticated / is redirected to /welcome via ProtectedRoute', async () => {
  renderWithProviders(<App />, { route: '/', authenticated: false });

  await waitFor(() => {
    expect(screen.getByRole('heading', { level: 1, name: /dziennik rozgrywek/i })).toBeInTheDocument();
  });
});
