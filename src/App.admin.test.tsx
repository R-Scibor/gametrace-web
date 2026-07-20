import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, resetStores, seedAuth } from '../test/utils';
import App from './App';

describe('admin routing', () => {
  beforeEach(() => {
    resetStores();
    seedAuth();
  });

  it('lands /admin on the overview surface', async () => {
    renderWithProviders(<App />, { route: '/admin', authenticated: true });

    expect(await screen.findByText('Wymaga uwagi')).toBeInTheDocument();
  });

  it('keeps the catalog reachable under the new shell', async () => {
    renderWithProviders(<App />, { route: '/admin/catalog', authenticated: true });

    expect(await screen.findByRole('link', { name: /Przegląd/i })).toBeInTheDocument();
  });
});
