import { screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import { StatsOverview } from './StatsOverview';
import { renderWithProviders } from '../../../test/utils';
import { SAMPLE_STATS_SUMMARY } from '../../lib/sampleData';

test('StatsOverview renders sampleData without fetching and without a record link', () => {
  renderWithProviders(<StatsOverview days={30} sampleData={SAMPLE_STATS_SUMMARY} />);
  expect(screen.getByText('Przegląd')).toBeInTheDocument();
  expect(screen.getByText('NOWE GRY')).toBeInTheDocument();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});

test('StatsOverview uses sampleData.days for the period subtitle, not the live days prop', () => {
  expect(SAMPLE_STATS_SUMMARY.days).toBe(30);
  renderWithProviders(<StatsOverview days={365} sampleData={SAMPLE_STATS_SUMMARY} />);
  expect(screen.getByText(/w ciągu ostatnich 30 dni/i)).toBeInTheDocument();
  expect(screen.queryByText(/365/)).not.toBeInTheDocument();
});
