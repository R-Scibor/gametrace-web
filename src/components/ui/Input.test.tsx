import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, vi } from 'vitest';
import { Input } from './Input';

test('renders a bare input when labelled via aria-label', () => {
  const { container } = render(<Input aria-label="Szukaj" />);

  // No wrapper: call sites put flex/width on the input itself, so it has to
  // stay the direct child of their layout container.
  expect(container.firstElementChild?.tagName).toBe('INPUT');
  expect(screen.getByLabelText('Szukaj')).toBeInTheDocument();
});

test('associates a visible label with the input', () => {
  render(<Input label="Nowy alias" />);

  const input = screen.getByLabelText('Nowy alias');
  expect(input).toHaveAttribute('id');
  expect(screen.getByText('Nowy alias').tagName).toBe('LABEL');
});

test('an explicit id wins over the derived one', () => {
  render(<Input label="Nowy alias" id="custom-id" />);

  expect(screen.getByLabelText('Nowy alias')).toHaveAttribute('id', 'custom-id');
});

test('appends a caller className rather than replacing the base styles', () => {
  render(<Input aria-label="Szukaj" className="callerClass" />);

  const input = screen.getByLabelText('Szukaj');
  expect(input.className).toContain('callerClass');
  // The base class is still there, so callers add layout without losing chrome.
  expect(input.className.split(' ').length).toBeGreaterThan(1);
});

test('forwards value and change events', async () => {
  const onChange = vi.fn();
  render(<Input aria-label="Szukaj" value="" onChange={onChange} />);

  await userEvent.type(screen.getByLabelText('Szukaj'), 'a');
  expect(onChange).toHaveBeenCalled();
});

test('forwards arbitrary input attributes', () => {
  render(<Input aria-label="Szukaj" type="search" placeholder="nazwa" disabled />);

  const input = screen.getByLabelText('Szukaj');
  expect(input).toHaveAttribute('type', 'search');
  expect(input).toHaveAttribute('placeholder', 'nazwa');
  expect(input).toBeDisabled();
});
