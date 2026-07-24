import { screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import { GameCard } from './GameCard';
import { renderWithProviders } from '../../../test/utils';
import type { Game } from '../../types/api';

const game: Game = {
  id: -1,
  primary_name: "Baldur's Gate 3",
  cover_image_url: null,
  cover_source: 'EXTERNAL',
  enrichment_status: 'ENRICHED',
  is_ignored: false,
  is_accepted: true,
  total_seconds: 3600,
  last_played: null,
};

test('GameCard renders a link by default', () => {
  renderWithProviders(<GameCard game={game} />);
  expect(screen.getByRole('link', { name: /baldur/i })).toHaveAttribute('href', '/library/-1');
});

test('GameCard disabled renders no link', () => {
  renderWithProviders(<GameCard game={game} disabled />);
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  expect(screen.getByText(/baldur/i)).toBeInTheDocument();
});
