import { screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import { RecentSessionsList } from './RecentSessionsList';
import { renderWithProviders } from '../../../test/utils';
import type { Session } from '../../types/api';

const session: Session = {
  id: -100,
  game_id: -1,
  game: { id: -1, primary_name: 'Baldur\'s Gate 3', cover_image_url: null },
  start_time: '2026-07-01T18:00:00.000Z',
  end_time: '2026-07-01T20:00:00.000Z',
  duration_seconds: 7200,
  status: 'COMPLETED',
  source: 'MANUAL',
  notes: null,
  created_at: '2026-07-01T20:00:00.000Z',
};

test('RecentSessionsList renders a link by default', () => {
  renderWithProviders(<RecentSessionsList sessions={[session]} />);
  expect(screen.getByRole('link')).toHaveAttribute('href', '/library/-1');
});

test('RecentSessionsList disabled renders no link', () => {
  renderWithProviders(<RecentSessionsList sessions={[session]} disabled />);
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  expect(screen.getByText(/baldur/i)).toBeInTheDocument();
});
