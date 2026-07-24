import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, vi } from 'vitest';
import { Switch } from './Switch';

test('Switch renders as an accessible switch reflecting checked state', () => {
  render(<Switch checked label="Podgląd przykładowy" onChange={() => {}} />);
  const control = screen.getByRole('switch', { name: 'Podgląd przykładowy' });
  expect(control).toHaveAttribute('aria-checked', 'true');
});

test('Switch calls onChange with the toggled value on click', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Switch checked={false} label="Podgląd przykładowy" onChange={onChange} />);
  await user.click(screen.getByRole('switch', { name: 'Podgląd przykładowy' }));
  expect(onChange).toHaveBeenCalledWith(true);
});

test('Switch does not call onChange when disabled', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Switch checked={false} label="Podgląd przykładowy" onChange={onChange} disabled />);
  await user.click(screen.getByRole('switch', { name: 'Podgląd przykładowy' }));
  expect(onChange).not.toHaveBeenCalled();
});

test('Switch reflects unchecked state via aria-checked', () => {
  render(<Switch checked={false} label="Podgląd przykładowy" onChange={() => {}} />);
  const control = screen.getByRole('switch', { name: 'Podgląd przykładowy' });
  expect(control).toHaveAttribute('aria-checked', 'false');
});

test('Switch applies the disabled attribute', () => {
  render(<Switch checked label="Podgląd przykładowy" onChange={() => {}} disabled />);
  expect(screen.getByRole('switch', { name: 'Podgląd przykładowy' })).toBeDisabled();
});
