import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TimezoneSelect, rankTimezones } from './TimezoneSelect';

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

  it('renders non-option hint footer on empty query and hides it when typing', async () => {
    const user = userEvent.setup();
    render(<TimezoneSelect value="Europe/Warsaw" onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /strefa czasowa/i }));

    const hint = screen.getByRole('note');
    expect(hint).toBeInTheDocument();
    expect(hint).toHaveTextContent(/wpisz, aby wyszukać wszystkie strefy/i);
    expect(screen.getAllByRole('option')).not.toContain(hint);

    const input = screen.getByRole('combobox');
    await user.type(input, 'tokyo');
    expect(screen.queryByRole('note')).not.toBeInTheDocument();

    await user.clear(input);
    expect(screen.getByRole('note')).toBeInTheDocument();
  });
});

describe('rankTimezones', () => {
  it("prioritizes Tier 0 so 'eu' query first results are all Europe/ zones", () => {
    const sample = [
      'America/North_Dakota/Beulah',
      'Africa/Ceuta',
      'Europe/Warsaw',
      'Europe/Berlin',
      'Europe/London',
    ];
    const results = rankTimezones(sample, 'eu');
    expect(results).toEqual([
      'Europe/Berlin',
      'Europe/London',
      'Europe/Warsaw',
      'Africa/Ceuta',
      'America/North_Dakota/Beulah',
    ]);
    const tier0 = results.slice(0, 3);
    expect(tier0.every((z) => z.startsWith('Europe/'))).toBe(true);
  });

  it('orders by tiers (Tier 0, then Tier 1, then Tier 2) and alphabetical within each tier', () => {
    const sample = [
      'Europe/Warsaw', // Tier 2 (substring 'ar' in 'warsaw')
      'America/Punta_Arenas', // Tier 1 (word 'arenas' starts with 'ar')
      'America/Argentina/Buenos_Aires', // Tier 0 (segment 'argentina' starts with 'ar')
      'America/Araguaina', // Tier 0 (segment 'araguaina' starts with 'ar')
      'America/New_York', // non-match
    ];
    const results = rankTimezones(sample, 'ar');
    expect(results).toEqual([
      // Tier 0 (alphabetical)
      'America/Araguaina',
      'America/Argentina/Buenos_Aires',
      // Tier 1
      'America/Punta_Arenas',
      // Tier 2
      'Europe/Warsaw',
    ]);
  });

  it('normalizes underscores to spaces and matches query with underscores and varying case', () => {
    const sample = [
      'America/New_York',
      'America/Argentina/Buenos_Aires',
      'Europe/Isle_of_Man',
    ];

    expect(rankTimezones(sample, 'new york')).toEqual(['America/New_York']);
    expect(rankTimezones(sample, 'new_york')).toEqual(['America/New_York']);
    expect(rankTimezones(sample, 'NEW_YORK')).toEqual(['America/New_York']);
    expect(rankTimezones(sample, 'buenos_aires')).toEqual(['America/Argentina/Buenos_Aires']);
    expect(rankTimezones(sample, 'buenos aires')).toEqual(['America/Argentina/Buenos_Aires']);
    expect(rankTimezones(sample, 'isle_of_man')).toEqual(['Europe/Isle_of_Man']);
    expect(rankTimezones(sample, 'man')).toEqual(['Europe/Isle_of_Man']);
  });

  it('ranks region prefix above city prefix (Europe/* before Australia/Eucla)', () => {
    const results = rankTimezones(['Australia/Eucla', 'Europe/Warsaw', 'Europe/Athens'], 'eu');
    expect(results).toEqual(['Europe/Athens', 'Europe/Warsaw', 'Australia/Eucla']);
  });

  it('returns empty array when query is empty or whitespace', () => {
    expect(rankTimezones(['Europe/Warsaw'], '')).toEqual([]);
    expect(rankTimezones(['Europe/Warsaw'], '   ')).toEqual([]);
  });
});
