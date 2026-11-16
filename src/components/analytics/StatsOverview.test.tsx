import { screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import { StatsOverview } from './StatsOverview';
import { renderWithProviders } from '../../../test/utils';
import { SAMPLE_STATS_SUMMARY } from '../../lib/sampleData';
import type { StatsSummary } from '../../types/api';

test('StatsOverview renders sampleData without fetching and without a record link', () => {
  renderWithProviders(<StatsOverview days={30} sampleData={SAMPLE_STATS_SUMMARY} />);
  expect(screen.getByText('ŚR. SESJA')).toBeInTheDocument();
  expect(screen.getByText('NOWE GRY')).toBeInTheDocument();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});

test('StatsOverview uses sampleData.days for the period subtitle, not the live days prop', () => {
  expect(SAMPLE_STATS_SUMMARY.days).toBe(30);
  renderWithProviders(<StatsOverview days={365} sampleData={SAMPLE_STATS_SUMMARY} />);
  expect(screen.getByText(/w ciągu ostatnich 30 dni/i)).toBeInTheDocument();
  expect(screen.queryByText(/365/)).not.toBeInTheDocument();
});

test('StatsOverview formats durations with formatDurationOrZero and no standalone h unit', () => {
  const customData: StatsSummary = {
    ...SAMPLE_STATS_SUMMARY,
    avg_session_seconds: 5400,
    longest_session_seconds: 7200,
    longest_session_game_id: -1,
    longest_session_game_name: "Baldur's Gate 3",
  };
  renderWithProviders(<StatsOverview days={30} sampleData={customData} />);
  expect(screen.getByText('1h 30m')).toBeInTheDocument();
  expect(screen.getByText('2h 0m')).toBeInTheDocument();
  expect(screen.queryByText(/^h$/)).not.toBeInTheDocument();
});
