import { render, screen } from '@testing-library/react';
import { Cover } from './Cover';

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
