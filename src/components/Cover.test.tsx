import { render, screen } from '@testing-library/react';
import { test, expect, beforeEach } from 'vitest';
import { Cover } from './Cover';
import { useLocalCoversStore } from '../store/localCoversStore';
import { resetStores } from '../../test/utils';

beforeEach(() => {
  resetStores();
});

test('Cover renders image when url is provided', () => {
  render(<Cover coverImageUrl="/covers/test.jpg" />);
  const img = screen.getByRole('img');
  expect(img).toHaveAttribute('src', '/covers/test.jpg');
});

test('Cover renders placeholder when url is null', () => {
  render(<Cover coverImageUrl={null} placeholderChar="Game" />);
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.getByText('G')).toBeInTheDocument();
});

test('Cover prefers local override when gameId is set', () => {
  useLocalCoversStore.setState({ covers: { 1: 'data:image/png;base64,local' } });
  render(<Cover gameId={1} coverImageUrl="/covers/server.jpg" />);
  expect(screen.getByRole('img')).toHaveAttribute('src', 'data:image/png;base64,local');
});