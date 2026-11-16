import { render, screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import { SortIndicator } from './SortIndicator';

test('SortIndicator renders nothing when active is false', () => {
  render(<SortIndicator active={false} dir="asc" />);
  expect(screen.queryByTestId('sort-indicator')).not.toBeInTheDocument();
});

test('SortIndicator renders ascending arrow when dir is asc', () => {
  render(<SortIndicator active dir="asc" />);
  const indicator = screen.getByTestId('sort-indicator');
  expect(indicator).toBeInTheDocument();
  expect(indicator).toHaveAttribute('data-dir', 'asc');
});

test('SortIndicator renders descending arrow when dir is desc', () => {
  render(<SortIndicator active dir="desc" />);
  const indicator = screen.getByTestId('sort-indicator');
  expect(indicator).toBeInTheDocument();
  expect(indicator).toHaveAttribute('data-dir', 'desc');
});
