import { screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import { RankingPanel, HeatmapPanel, TrendPanel } from './Panels';
import { renderWithProviders } from '../../../test/utils';
import { SAMPLE_STATS_SUMMARY, SAMPLE_HEATMAP, SAMPLE_TREND } from '../../lib/sampleData';

test('RankingPanel renders sampleData with inert rows, no fetch', () => {
  renderWithProviders(<RankingPanel days={30} sampleData={SAMPLE_STATS_SUMMARY.per_game} />);
  expect(screen.getByText('Ranking gier')).toBeInTheDocument();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});

test('HeatmapPanel renders sampleData without fetching', () => {
  renderWithProviders(<HeatmapPanel days={30} sampleData={SAMPLE_HEATMAP.cells} />);
  expect(screen.getByText('Mapa aktywności')).toBeInTheDocument();
});

test('TrendPanel renders sampleData without fetching', () => {
  renderWithProviders(<TrendPanel days={30} sampleData={SAMPLE_TREND} />);
  expect(screen.getByText(/trend/i)).toBeInTheDocument();
});
