import { screen, waitFor } from '@testing-library/react';
import { test, expect, vi } from 'vitest';
import { RankingPanel, HeatmapPanel, TrendPanel } from './Panels';
import { renderWithProviders } from '../../../test/utils';
import { SAMPLE_STATS_SUMMARY, SAMPLE_HEATMAP, SAMPLE_TREND } from '../../lib/sampleData';
import { formatDuration } from '../../lib/format';

// Mirrors Heatmap.tsx's DAY_LABELS ordering (Monday-first).
const DAY_LABELS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nied'];

test('RankingPanel renders sampleData with inert rows, no fetch', async () => {
  renderWithProviders(<RankingPanel days={30} sampleData={SAMPLE_STATS_SUMMARY.per_game} />);
  expect(screen.getByText('Ranking gier')).toBeInTheDocument();
  expect(screen.getByText(SAMPLE_STATS_SUMMARY.per_game[0].game_name)).toBeInTheDocument();
  // Awaited so this would still catch a regression where sampleData handling is removed:
  // the real (MSW-mocked) query would eventually resolve and render actual <Link> rows.
  await waitFor(() => {
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});

test('HeatmapPanel renders sampleData without fetching', async () => {
  renderWithProviders(<HeatmapPanel days={30} sampleData={SAMPLE_HEATMAP.cells} />);
  expect(screen.getByText('Mapa aktywności')).toBeInTheDocument();

  // Pick the cell with the most play time -- its rendered tooltip/aria-label encodes
  // day, hour and duration derived directly from SAMPLE_HEATMAP, which a loading
  // Skeleton (no cells at all) could never produce.
  const targetCell = SAMPLE_HEATMAP.cells.reduce(
    (max, c) => (c.seconds > max.seconds ? c : max),
    SAMPLE_HEATMAP.cells[0],
  );
  const expectedPrefix = `${DAY_LABELS[targetCell.dow]} ${targetCell.hour}:00`;
  const expectedSuffix = formatDuration(targetCell.seconds);

  await waitFor(() => {
    const match = screen
      .getAllByRole('button')
      .find((btn) => {
        const label = btn.getAttribute('aria-label') ?? '';
        return label.startsWith(expectedPrefix) && label.endsWith(expectedSuffix);
      });
    expect(match).toBeTruthy();
  });
});

test('TrendPanel renders sampleData without fetching', async () => {
  // recharts' ResponsiveContainer needs a measured size to render its SVG children in
  // jsdom; without these shims the chart stays a 0x0 wrapper with no queryable content.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 600,
    height: 200,
    top: 0,
    left: 0,
    bottom: 200,
    right: 600,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);

  try {
    renderWithProviders(<TrendPanel days={30} sampleData={SAMPLE_TREND} />);
    expect(screen.getByText(/trend/i)).toBeInTheDocument();

    // The last bucket's x-axis tick label is derived straight from SAMPLE_TREND and
    // could not appear while the panel is still showing its loading Skeleton.
    const lastBucket = SAMPLE_TREND.buckets[SAMPLE_TREND.buckets.length - 1];
    const expectedLabel = lastBucket.bucket_start.slice(5, 10);
    await waitFor(() => {
      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
    });
  } finally {
    rectSpy.mockRestore();
    vi.unstubAllGlobals();
  }
});
