import { screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import { HeroSpotlight } from './HeroSpotlight';
import { renderWithProviders } from '../../../test/utils';
import type { Session, GameStats } from '../../types/api';

const session: Session = {
  id: -100,
  game_id: -1,
  game: { id: -1, primary_name: "Baldur's Gate 3", cover_image_url: null },
  start_time: '2026-07-01T18:00:00.000Z',
  end_time: '2026-07-01T20:00:00.000Z',
  duration_seconds: 7200,
  status: 'COMPLETED',
  source: 'MANUAL',
  notes: null,
  created_at: '2026-07-01T20:00:00.000Z',
};

const stats: GameStats = {
  game_id: -1,
  total_seconds: 36000,
  session_count: 5,
  first_played: '2026-01-01T18:00:00.000Z',
  last_played: '2026-07-01T20:00:00.000Z',
};

test('HeroSpotlight renders a link by default', () => {
  renderWithProviders(<HeroSpotlight session={session} stats={stats} />);
  expect(screen.getByRole('link', { name: /baldur/i })).toHaveAttribute('href', '/library/-1');
});

test('HeroSpotlight disabled renders no link', () => {
  renderWithProviders(<HeroSpotlight session={session} stats={stats} disabled />);
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  expect(screen.getByText(/baldur/i)).toBeInTheDocument();
});
