
import { screen } from '@testing-library/react';
import { renderWithProviders } from './utils';
import App from '../src/App';
import { test, expect } from 'vitest';

test('renders App smoke test', async () => {
  renderWithProviders(<App />, { route: '/welcome' });
  expect(await screen.findByRole('heading', { level: 1, name: /GameTrace/i })).toBeInTheDocument();
});