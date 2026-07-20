import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';
import { test, expect, vi } from 'vitest';

test('Modal renders nothing when open is false', () => {
  const { container } = render(
    <Modal open={false} onClose={vi.fn()} labelledBy="test-title">
      <p>Treść</p>
    </Modal>,
  );
  expect(container).toBeEmptyDOMElement();
});

test('Modal renders children when open is true', () => {
  render(
    <Modal open onClose={vi.fn()} labelledBy="test-title">
      <p>Treść</p>
    </Modal>,
  );
  expect(screen.getByText('Treść')).toBeInTheDocument();
});

test('clicking the overlay calls onClose', () => {
  const onClose = vi.fn();
  render(
    <Modal open onClose={onClose} labelledBy="test-title">
      <p>Treść</p>
    </Modal>,
  );
  fireEvent.click(screen.getByRole('presentation'));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('clicking inside the dialog body does not call onClose', () => {
  const onClose = vi.fn();
  render(
    <Modal open onClose={onClose} labelledBy="test-title">
      <p>Treść</p>
    </Modal>,
  );
  fireEvent.click(screen.getByText('Treść'));
  expect(onClose).not.toHaveBeenCalled();
});

test('dialog carries aria-modal and aria-labelledby matching the passed id', () => {
  render(
    <Modal open onClose={vi.fn()} labelledBy="test-title">
      <p>Treść</p>
    </Modal>,
  );
  const dialog = screen.getByRole('dialog');
  expect(dialog).toHaveAttribute('aria-modal', 'true');
  expect(dialog).toHaveAttribute('aria-labelledby', 'test-title');
});
