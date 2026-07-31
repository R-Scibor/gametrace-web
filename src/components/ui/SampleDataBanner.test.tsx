import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, vi } from 'vitest';
import { SampleDataBanner } from './SampleDataBanner';
import { renderWithProviders } from '../../../test/utils';

test('SampleDataBanner shows the illustrative-data copy and links to /sessions/new', () => {
  renderWithProviders(<SampleDataBanner />);
  expect(screen.getByText(/to są przykładowe dane/i)).toBeInTheDocument();
  const cta = screen.getByRole('link', { name: /dodaj sesję/i });
  expect(cta).toHaveAttribute('href', '/sessions/new');
});

test('SampleDataBanner does not render a dismiss control when onDismiss is omitted', () => {
  renderWithProviders(<SampleDataBanner />);
  expect(screen.queryByRole('button', { name: /ukryj przykładowe/i })).not.toBeInTheDocument();
});

test('SampleDataBanner calls onDismiss when the dismiss control is clicked', async () => {
  const user = userEvent.setup();
  const onDismiss = vi.fn();
  renderWithProviders(<SampleDataBanner onDismiss={onDismiss} />);

  await user.click(screen.getByRole('button', { name: /ukryj przykładowe/i }));

  expect(onDismiss).toHaveBeenCalledTimes(1);
});
