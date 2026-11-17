import { screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import { DashboardStatTiles } from './DashboardStatTiles';
import { renderWithProviders, splitText } from '../../../test/utils';
import { EMPTY_VALUE } from '../../lib/format';

test('DashboardStatTiles formats zero seconds as 0m', () => {
  renderWithProviders(
    <DashboardStatTiles
      todaySeconds={0}
      weekSeconds={0}
      avgSessionSeconds={0}
      streakDays={0}
    />,
  );
  expect(screen.getAllByText(splitText('0m'))).toHaveLength(3);
  expect(screen.queryByText(/^h$/)).not.toBeInTheDocument();
});

test('DashboardStatTiles formats durations as Xh Ym with small h and m units', () => {
  renderWithProviders(
    <DashboardStatTiles
      todaySeconds={3600}
      weekSeconds={5400}
      avgSessionSeconds={7200}
      streakDays={3}
    />,
  );
  expect(screen.getByText(splitText('1h 0m'))).toBeInTheDocument();
  expect(screen.getByText(splitText('1h 30m'))).toBeInTheDocument();
  expect(screen.getByText(splitText('2h 0m'))).toBeInTheDocument();
  expect(screen.getAllByText('h').length).toBeGreaterThan(0);
  expect(screen.getAllByText('m').length).toBeGreaterThan(0);
  expect(screen.getByText('3')).toBeInTheDocument();
});

test('DashboardStatTiles shows empty placeholder when avg is loading or null', () => {
  renderWithProviders(
    <DashboardStatTiles
      todaySeconds={0}
      weekSeconds={0}
      avgSessionSeconds={null}
      streakDays={null}
    />,
  );
  expect(screen.getAllByText(EMPTY_VALUE)).toHaveLength(2);
});

test('DashboardStatTiles shows empty placeholder when avgLoading is true', () => {
  renderWithProviders(
    <DashboardStatTiles
      todaySeconds={0}
      weekSeconds={0}
      avgSessionSeconds={3600}
      avgLoading={true}
      streakDays={null}
    />,
  );
  expect(screen.getAllByText(EMPTY_VALUE)).toHaveLength(2);
});
