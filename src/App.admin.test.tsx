import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, resetStores, seedAuth } from '../test/utils';
import App from './App';

/**
 * These render the whole App, so the assertion has to wait on a lazily imported
 * route chunk. Under full-suite parallel load that import regularly overran RTL's
 * 1000ms default and produced an intermittent failure. The assertions are
 * unchanged; they are just given room to resolve the chunk.
 */
const LAZY_ROUTE_TIMEOUT = 5000;

describe('admin routing', () => {
  beforeEach(() => {
    resetStores();
    seedAuth();
  });

  it('lands /admin on the overview surface', async () => {
    renderWithProviders(<App />, { route: '/admin', authenticated: true });

    expect(
      await screen.findByText('Wymaga uwagi', {}, { timeout: LAZY_ROUTE_TIMEOUT }),
    ).toBeInTheDocument();
  });

  it('keeps the catalog reachable under the new shell', async () => {
    renderWithProviders(<App />, { route: '/admin/catalog', authenticated: true });

    expect(
      await screen.findByLabelText('Szukaj gry', {}, { timeout: LAZY_ROUTE_TIMEOUT }),
    ).toBeInTheDocument();
  });
});
