import { screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import { GameRankingTable } from './GameRankingTable';
import { renderWithProviders } from '../../../test/utils';
import type { GameStatEntry } from '../../types/api';

const games: GameStatEntry[] = [
  { game_id: -1, game_name: "Baldur's Gate 3", cover_image_url: null, total_seconds: 3600 },
];

test('GameRankingTable renders a link by default', () => {
  renderWithProviders(<GameRankingTable games={games} />);
  expect(screen.getByRole('link', { name: /baldur/i })).toHaveAttribute('href', '/library/-1');
});

test('GameRankingTable disabled renders no link but keeps sort buttons', () => {
  renderWithProviders(<GameRankingTable games={games} disabled />);
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  expect(screen.getByText(/baldur/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /gra/i })).toBeInTheDocument();
});
