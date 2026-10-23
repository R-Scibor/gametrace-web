import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TimezoneSelect } from './TimezoneSelect';

function ControlledTimezoneSelect({
  initialValue = 'Europe/Warsaw',
  onChange = vi.fn(),
  disabled = false,
}: {
  initialValue?: string;
  onChange?: (tz: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <TimezoneSelect
      value={value}
      disabled={disabled}
      onChange={(tz) => {
        setValue(tz);
        onChange(tz);
      }}
    />
  );
}

describe('TimezoneSelect', () => {
  it('renders the current timezone as a chip with change action', () => {
    render(<TimezoneSelect value="Europe/Warsaw" onChange={vi.fn()} />);

    const chip = screen.getByRole('button', { name: /strefa czasowa/i });
    expect(chip).toBeInTheDocument();
    expect(screen.getByText('Europe/Warsaw')).toBeInTheDocument();
    expect(screen.getByText(/zmień/i)).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('formats zone name by replacing underscores with spaces on the chip', () => {
    render(<TimezoneSelect value="America/New_York" onChange={vi.fn()} />);

    expect(screen.getByText('America/New York')).toBeInTheDocument();
  });

  it('clicking chip opens search input and reveals common zones group', async () => {
    const user = userEvent.setup();
    render(<TimezoneSelect value="Europe/Warsaw" onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /strefa czasowa/i }));

    const input = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();
    expect(screen.getByText('CZĘSTE')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Europe\/London/i })).toBeInTheDocument();
  });

  it('prepends current zone to common list if not already present', async () => {
    const user = userEvent.setup();
    render(<TimezoneSelect value="Atlantic/Reykjavik" onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /strefa czasowa/i }));

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveTextContent(/Atlantic\/Reykjavik/i);
  });

  it('typing filters the full list and hides common group', async () => {
    const user = userEvent.setup();
    render(<TimezoneSelect value="Europe/Warsaw" onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /strefa czasowa/i }));
    await user.type(screen.getByRole('combobox'), 'tokyo');

    expect(screen.getByRole('option', { name: /Asia\/Tokyo/i })).toBeInTheDocument();
    expect(screen.queryByText('CZĘSTE')).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Europe\/London/i })).not.toBeInTheDocument();
  });

  it('spaces in query match underscores in zone names', async () => {
    const user = userEvent.setup();
    render(<TimezoneSelect value="Europe/Warsaw" onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /strefa czasowa/i }));
    await user.type(screen.getByRole('combobox'), 'new york');

    expect(screen.getByRole('option', { name: /America\/New York/i })).toBeInTheDocument();
  });

  it('selecting a different zone calls onChange and closes dropdown', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledTimezoneSelect initialValue="Europe/Warsaw" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /strefa czasowa/i }));
    await user.type(screen.getByRole('combobox'), 'tokyo');
    await user.click(screen.getByRole('option', { name: /Asia\/Tokyo/i }));

    expect(onChange).toHaveBeenCalledWith('Asia/Tokyo');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByText('Asia/Tokyo')).toBeInTheDocument();
  });

  it('selecting the currently active zone closes dropdown without calling onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledTimezoneSelect initialValue="Europe/Warsaw" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /strefa czasowa/i }));
    await user.click(screen.getByRole('option', { name: /Europe\/Warsaw/i }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('keyboard navigation with ArrowDown and Enter selects option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledTimezoneSelect initialValue="Europe/Warsaw" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /strefa czasowa/i }));
    const input = screen.getByRole('combobox');
    await user.type(input, 'tokyo');

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith('Asia/Tokyo');
  });

  it('ArrowUp on first item resets activeKey back to null', async () => {
    const user = userEvent.setup();
    render(<TimezoneSelect value="Europe/Warsaw" onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /strefa czasowa/i }));
    const input = screen.getByRole('combobox');
    await user.type(input, 'tokyo');

    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant');

    await user.keyboard('{ArrowUp}');
    expect(input).not.toHaveAttribute('aria-activedescendant');
  });

  it('Escape key closes dropdown, resets query, and restores focus', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimezoneSelect value="Europe/Warsaw" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /strefa czasowa/i }));
    await user.type(screen.getByRole('combobox'), 'tokyo');
    await user.keyboard('{Escape}');

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /strefa czasowa/i })).toHaveFocus();
  });

  it('Tab key closes dropdown without selecting', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <div>
        <TimezoneSelect value="Europe/Warsaw" onChange={onChange} />
        <button type="button">Next control</button>
      </div>
    );

    await user.click(screen.getByRole('button', { name: /strefa czasowa/i }));
    await user.tab();

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('click outside closes dropdown without selecting', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <div>
        <TimezoneSelect value="Europe/Warsaw" onChange={onChange} />
        <div data-testid="outside">Outside area</div>
      </div>
    );

    await user.click(screen.getByRole('button', { name: /strefa czasowa/i }));
    expect(screen.getByRole('combobox')).toBeInTheDocument();

    await user.click(screen.getByTestId('outside'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('unknown query shows empty status message', async () => {
    const user = userEvent.setup();
    render(<TimezoneSelect value="Europe/Warsaw" onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /strefa czasowa/i }));
    await user.type(screen.getByRole('combobox'), 'not-a-valid-zone');

    expect(screen.getByRole('status')).toHaveTextContent(/brak wyników/i);
  });

  it('disabled state prevents opening and sets disabled attribute', async () => {
    const user = userEvent.setup();
    render(<TimezoneSelect value="Europe/Warsaw" onChange={vi.fn()} disabled />);

    const chip = screen.getByRole('button', { name: /strefa czasowa/i });
    expect(chip).toBeDisabled();

    await user.click(chip);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
