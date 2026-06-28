import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';
import { test, expect, vi } from 'vitest';

test('Button renders label and fires onClick', async () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Click me</Button>);
  const btn = screen.getByRole('button', { name: /click me/i });
  expect(btn).toBeInTheDocument();
  await userEvent.click(btn);
  expect(onClick).toHaveBeenCalledTimes(1);
});

test('Button disables and shows loading state', async () => {
  const onClick = vi.fn();
  render(<Button loading onClick={onClick}>Click me</Button>);
  const btn = screen.getByRole('button', { name: /ładowanie/i });
  expect(btn).toBeDisabled();
  await userEvent.click(btn);
  expect(onClick).not.toHaveBeenCalled();
});
