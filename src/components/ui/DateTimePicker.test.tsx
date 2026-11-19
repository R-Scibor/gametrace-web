import { render, screen, fireEvent, within } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import i18n from '../../i18n';
import { DateTimePicker } from './DateTimePicker';

beforeEach(async () => {
  await i18n.changeLanguage('pl');
});

function Harness({ initial = '', onChange = vi.fn() }: { initial?: string; onChange?: (v: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <label htmlFor="dt">Rozpoczęcie</label>
      <DateTimePicker
        id="dt"
        value={value}
        onChange={(v) => {
          setValue(v);
          onChange(v);
        }}
      />
    </>
  );
}

const trigger = () => screen.getByRole('button', { name: 'Rozpoczęcie' });

test('shows the value in the app language, not the browser format', async () => {
  const { unmount } = render(<Harness initial="2026-11-17T20:54" />);
  expect(trigger()).toHaveTextContent(/17 lis 2026.*20:54/);
  unmount();
  await i18n.changeLanguage('en');
  render(<Harness initial="2026-11-17T08:05" />);
  expect(trigger()).toHaveTextContent(/17 Nov 2026.*08:05/);
});

test('shows a placeholder when empty', () => {
  render(<Harness />);
  expect(trigger()).toHaveTextContent('Wybierz...');
});

test('picking a day, hour and minute confirms a datetime-local string', () => {
  const onChange = vi.fn();
  render(<Harness initial="2026-11-17T20:54" onChange={onChange} />);
  fireEvent.click(trigger());
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByText('Listopad 2026')).toBeInTheDocument();

  fireEvent.click(within(dialog).getByRole('button', { name: '3 listopada 2026' }));
  fireEvent.click(within(within(dialog).getByRole('listbox', { name: 'Godzina' })).getByRole('option', { name: '07' }));
  fireEvent.click(within(within(dialog).getByRole('listbox', { name: 'Minuty' })).getByRole('option', { name: '05' }));
  fireEvent.click(within(dialog).getByRole('button', { name: 'Potwierdź' }));

  expect(onChange).toHaveBeenCalledWith('2026-11-03T07:05');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger()).toHaveTextContent(/3 lis 2026.*07:05/);
});

test('cancel keeps the old value', () => {
  const onChange = vi.fn();
  render(<Harness initial="2026-11-17T20:54" onChange={onChange} />);
  fireEvent.click(trigger());
  fireEvent.click(screen.getByRole('button', { name: '3 listopada 2026' }));
  fireEvent.click(screen.getByRole('button', { name: 'Anuluj' }));
  expect(onChange).not.toHaveBeenCalled();
  expect(trigger()).toHaveTextContent(/17 lis 2026/);
});

test('month navigation crosses the year and clamps the day', () => {
  const onChange = vi.fn();
  render(<Harness initial="2027-01-31T10:00" onChange={onChange} />);
  fireEvent.click(trigger());
  fireEvent.click(screen.getByRole('button', { name: 'Następny miesiąc' }));
  expect(screen.getByText('Luty 2027')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Poprzedni miesiąc' }));
  fireEvent.click(screen.getByRole('button', { name: 'Poprzedni miesiąc' }));
  expect(screen.getByText('Grudzień 2026')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Potwierdź' }));
  // 31 Jan, to Feb clamps to 28, back to Dec keeps 28.
  expect(onChange).toHaveBeenCalledWith('2026-12-28T10:00');
});

test('arrow keys move the day and the time', () => {
  const onChange = vi.fn();
  render(<Harness initial="2026-11-30T23:59" onChange={onChange} />);
  fireEvent.click(trigger());
  const day = screen.getByRole('button', { name: '30 listopada 2026' });
  fireEvent.keyDown(day, { key: 'ArrowRight' });
  expect(screen.getByText('Grudzień 2026')).toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole('button', { name: '1 grudnia 2026' }), { key: 'ArrowDown' });
  fireEvent.keyDown(screen.getByRole('listbox', { name: 'Godzina' }), { key: 'ArrowDown' });
  fireEvent.keyDown(screen.getByRole('listbox', { name: 'Minuty' }), { key: 'Home' });
  fireEvent.click(screen.getByRole('button', { name: 'Potwierdź' }));
  expect(onChange).toHaveBeenCalledWith('2026-12-08T23:00');
});

test('disabled trigger does not open', () => {
  render(
    <>
      <label htmlFor="dt">Rozpoczęcie</label>
      <DateTimePicker id="dt" value="2026-11-17T20:54" onChange={vi.fn()} disabled />
    </>,
  );
  fireEvent.click(trigger());
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
