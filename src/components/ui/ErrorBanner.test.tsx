import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBanner } from './ErrorBanner';
import { test, expect, vi } from 'vitest';

test('ErrorBanner renders default text', () => {
  render(<ErrorBanner />);
  expect(screen.getByText('BŁĄD POŁĄCZENIA')).toBeInTheDocument();
  expect(screen.getByText('Nie udało się pobrać danych. Sprawdź połączenie.')).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

test('ErrorBanner renders custom text', () => {
  render(<ErrorBanner label="WARNING" message="Something broke" />);
  expect(screen.getByText('WARNING')).toBeInTheDocument();
  expect(screen.getByText('Something broke')).toBeInTheDocument();
});

test('ErrorBanner renders retry button and calls onRetry when clicked', async () => {
  const user = userEvent.setup();
  const onRetry = vi.fn();
  render(<ErrorBanner onRetry={onRetry} />);

  const button = screen.getByRole('button', { name: 'SPRÓBUJ PONOWNIE' });
  expect(button).toBeInTheDocument();
  await user.click(button);
  expect(onRetry).toHaveBeenCalledTimes(1);
});

test('ErrorBanner renders custom retry label when provided', () => {
  render(<ErrorBanner onRetry={() => {}} retryLabel="RELOAD" />);
  expect(screen.getByRole('button', { name: 'RELOAD' })).toBeInTheDocument();
});
