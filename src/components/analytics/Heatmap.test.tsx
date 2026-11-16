import { screen } from '@testing-library/react';
import { test, expect, describe } from 'vitest';
import { Heatmap } from './Heatmap';
import { renderWithProviders } from '../../../test/utils';
import i18n from '../../i18n';
import type { HeatmapCell } from '../../types/api';

describe('Heatmap scale legend', () => {
  const sampleCells: HeatmapCell[] = [
    { dow: 0, hour: 10, seconds: 7200 }, // 2h 0m
    { dow: 1, hour: 14, seconds: 3600 }, // 1h 0m
  ];

  test('renders legend with max duration text and aria-label in Polish', () => {
    renderWithProviders(<Heatmap data={sampleCells} />);

    const legend = screen.getByRole('img', {
      name: 'Skala kolorów od braku gry do 2h 0m na godzinę',
    });
    expect(legend).toBeInTheDocument();
    expect(screen.getByText('Mniej')).toBeInTheDocument();
    expect(screen.getByText('Więcej')).toBeInTheDocument();
    expect(screen.getByText('Najwięcej 2h 0m')).toBeInTheDocument();
  });

  test('renders legend with max duration text and aria-label in English', async () => {
    await i18n.changeLanguage('en');
    try {
      renderWithProviders(<Heatmap data={sampleCells} />);

      const legend = screen.getByRole('img', {
        name: 'Color scale from no play to 2h 0m per hour',
      });
      expect(legend).toBeInTheDocument();
      expect(screen.getByText('Less')).toBeInTheDocument();
      expect(screen.getByText('More')).toBeInTheDocument();
      expect(screen.getByText('Top cell 2h 0m')).toBeInTheDocument();
    } finally {
      await i18n.changeLanguage('pl');
    }
  });

  test('skips top cell text when data has max duration <= 1 second', () => {
    const emptyCells: HeatmapCell[] = [
      { dow: 0, hour: 10, seconds: 0 },
      { dow: 1, hour: 14, seconds: 1 },
    ];
    renderWithProviders(<Heatmap data={emptyCells} />);

    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByText('Mniej')).toBeInTheDocument();
    expect(screen.getByText('Więcej')).toBeInTheDocument();
    expect(screen.queryByText(/najwięcej/i)).not.toBeInTheDocument();
  });
});
