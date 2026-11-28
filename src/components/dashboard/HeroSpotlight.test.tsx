import { screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import { UnifiedHeroCard } from './UnifiedHeroCard';
import { HeroSpotlight } from './HeroSpotlight';
import { renderWithProviders, splitText } from '../../../test/utils';
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

test('HeroSpotlight formats total and average duration as Xh Ym with small h and m units', () => {
  renderWithProviders(<HeroSpotlight session={session} stats={stats} />);
  expect(screen.getByText(splitText('10h 0m'))).toBeInTheDocument();
  expect(screen.getByText(splitText('2h 0m'))).toBeInTheDocument();
  expect(screen.getAllByText('h').length).toBeGreaterThan(0);
  expect(screen.getAllByText('m').length).toBeGreaterThan(0);
});

test('HeroSpotlight formats zero total seconds as 0m', () => {
  const zeroStats: GameStats = { ...stats, total_seconds: 0, session_count: 0 };
  renderWithProviders(<HeroSpotlight session={session} stats={zeroStats} />);
  expect(screen.getByText(splitText('0m'))).toBeInTheDocument();
});

test('UnifiedHeroCard live shows details without a navigation label', () => {
  renderWithProviders(
    <UnifiedHeroCard
      mode="live"
      gameId={-1}
      gameName="Baldur's Gate 3"
      liveSession={{
        id: 1,
        game_id: -1,
        game_name: "Baldur's Gate 3",
        cover_image_url: null,
        start_time: new Date().toISOString(),
      }}
    />,
  );
  expect(screen.queryByText(/nawigacja/i)).not.toBeInTheDocument();
  expect(screen.getByText('szczegóły')).toBeInTheDocument();
});

test('UnifiedHeroCard live keeps the details prompt in document flow', () => {
  renderWithProviders(
    <UnifiedHeroCard
      mode="live"
      gameId={-1}
      gameName="Baldur's Gate 3"
      liveSession={{
        id: 1,
        game_id: -1,
        game_name: "Baldur's Gate 3",
        cover_image_url: null,
        start_time: '2026-06-15T11:00:00Z',
      }}
    />,
  );

  expect(screen.getByText('ROZPOCZĘTO')).toBeInTheDocument();
  const prompt = screen.getByText('szczegóły');
  expect(getComputedStyle(prompt).position).not.toBe('absolute');
});
