
import { screen } from '@testing-library/react';
import { renderWithProviders } from './utils';
import App from '../src/App';
import { test, expect } from 'vitest';

test('renders App smoke test', () => {
  renderWithProviders(<App />);
  expect(screen.getByRole('heading', { level: 1, name: /GameTrace/i })).toBeInTheDocument();
});
