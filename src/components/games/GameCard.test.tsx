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

test('GameCard with coversOnly hides title text but keeps link accessible', () => {
  renderWithProviders(<GameCard game={game} coversOnly />);
  expect(screen.queryByText("Baldur's Gate 3")).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: /baldur/i })).toHaveAttribute('href', '/library/-1');
});

test('GameCard shows visible review text for a NEEDS_REVIEW game and not for others', () => {
  const needsReviewGame: Game = {
    ...game,
    id: -2,
    primary_name: 'Hades II',
    enrichment_status: 'NEEDS_REVIEW',
    is_accepted: false,
  };

  const { unmount } = renderWithProviders(<GameCard game={needsReviewGame} />);
  expect(screen.getByText('Do sprawdzenia')).toBeInTheDocument();

  unmount();
  renderWithProviders(<GameCard game={game} />);
  expect(screen.queryByText('Do sprawdzenia')).not.toBeInTheDocument();
});

test('GameCard with coversOnly hides the review text line but keeps icon badge', () => {
  const needsReviewGame: Game = {
    ...game,
    id: -2,
    primary_name: 'Hades II',
    enrichment_status: 'NEEDS_REVIEW',
    is_accepted: false,
  };

  renderWithProviders(<GameCard game={needsReviewGame} coversOnly />);
  expect(screen.queryByText('Do sprawdzenia')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Do sprawdzenia')).toBeInTheDocument();
});
