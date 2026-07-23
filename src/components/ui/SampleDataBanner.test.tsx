import { screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import { SampleDataBanner } from './SampleDataBanner';
import { renderWithProviders } from '../../../test/utils';

test('SampleDataBanner shows the illustrative-data copy and links to /sessions/new', () => {
  renderWithProviders(<SampleDataBanner />);
  expect(screen.getByText(/to są przykładowe dane/i)).toBeInTheDocument();
  const cta = screen.getByRole('link', { name: /dodaj sesję/i });
  expect(cta).toHaveAttribute('href', '/sessions/new');
});
