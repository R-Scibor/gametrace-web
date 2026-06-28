import { render, screen } from '@testing-library/react';
import { ErrorBanner } from './ErrorBanner';
import { test, expect } from 'vitest';

test('ErrorBanner renders default text', () => {
  render(<ErrorBanner />);
  expect(screen.getByText('BŁĄD POŁĄCZENIA')).toBeInTheDocument();
  expect(screen.getByText('Nie udało się pobrać danych. Sprawdź połączenie.')).toBeInTheDocument();
});

test('ErrorBanner renders custom text', () => {
  render(<ErrorBanner label="WARNING" message="Something broke" />);
  expect(screen.getByText('WARNING')).toBeInTheDocument();
  expect(screen.getByText('Something broke')).toBeInTheDocument();
});
