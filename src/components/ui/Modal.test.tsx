import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
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

test('pressing Escape calls onClose', async () => {
  const onClose = vi.fn();
  render(
    <Modal open onClose={onClose} labelledBy="test-title">
      <p>Treść</p>
    </Modal>,
  );

  await userEvent.keyboard('{Escape}');
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('Escape does nothing once the modal is closed', async () => {
  const onClose = vi.fn();
  render(
    <Modal open={false} onClose={onClose} labelledBy="test-title">
      <p>Treść</p>
    </Modal>,
  );

  await userEvent.keyboard('{Escape}');
  expect(onClose).not.toHaveBeenCalled();
});

test('focus moves into the dialog when it opens', async () => {
  render(
    <Modal open onClose={vi.fn()} labelledBy="test-title">
      <button type="button">Pierwszy</button>
      <button type="button">Drugi</button>
    </Modal>,
  );

  await waitFor(() => expect(screen.getByRole('button', { name: 'Pierwszy' })).toHaveFocus());
});

test('Tab from the last focusable element wraps to the first', async () => {
  render(
    <Modal open onClose={vi.fn()} labelledBy="test-title">
      <button type="button">Pierwszy</button>
      <button type="button">Ostatni</button>
    </Modal>,
  );

  const first = screen.getByRole('button', { name: 'Pierwszy' });
  const last = screen.getByRole('button', { name: 'Ostatni' });

  await waitFor(() => expect(first).toHaveFocus());
  await userEvent.tab();
  expect(last).toHaveFocus();

  // Without a trap this would escape to the page behind the dialog.
  await userEvent.tab();
  expect(first).toHaveFocus();
});

test('Shift+Tab from the first focusable element wraps to the last', async () => {
  render(
    <Modal open onClose={vi.fn()} labelledBy="test-title">
      <button type="button">Pierwszy</button>
      <button type="button">Ostatni</button>
    </Modal>,
  );

  const first = screen.getByRole('button', { name: 'Pierwszy' });
  const last = screen.getByRole('button', { name: 'Ostatni' });

  await waitFor(() => expect(first).toHaveFocus());
  await userEvent.tab({ shift: true });
  expect(last).toHaveFocus();
});

test('focus returns to the trigger when the dialog closes', async () => {
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Otwórz
        </button>
        <Modal open={open} onClose={() => setOpen(false)} labelledBy="test-title">
          <button type="button">W środku</button>
        </Modal>
      </>
    );
  }

  render(<Harness />);
  const trigger = screen.getByRole('button', { name: 'Otwórz' });

  await userEvent.click(trigger);
  await waitFor(() => expect(screen.getByRole('button', { name: 'W środku' })).toHaveFocus());

  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(trigger).toHaveFocus());
});

test('focus stays put while typing, with an inline onClose that changes identity', async () => {
  function Harness() {
    const [value, setValue] = useState('');
    return (
      // Inline arrow: a new onClose identity on every render, which is how
      // every consumer in the app passes it.
      <Modal open onClose={() => {}} labelledBy="test-title">
        <button type="button">Zamknij</button>
        <input aria-label="Szukaj" value={value} onChange={(e) => setValue(e.target.value)} />
      </Modal>
    );
  }

  render(<Harness />);
  const input = screen.getByLabelText('Szukaj');

  await userEvent.click(input);
  await userEvent.type(input, 'abc');

  expect(input).toHaveFocus();
  expect(input).toHaveValue('abc');
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
