import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LanguageSelect } from './LanguageSelect';

describe('LanguageSelect', () => {
  describe('variant="select" (default)', () => {
    it('renders a select element with Polish and English options', () => {
      render(<LanguageSelect value="pl" onChange={vi.fn()} />);

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(select).toHaveValue('pl');
      expect(screen.getByRole('option', { name: 'Polski' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
    });

    it('invokes onChange when a different option is selected', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<LanguageSelect value="pl" onChange={onChange} />);

      await user.selectOptions(screen.getByRole('combobox'), 'en');
      expect(onChange).toHaveBeenCalledWith('en');
    });

    it('disables the select element when disabled=true', () => {
      render(<LanguageSelect value="pl" onChange={vi.fn()} disabled />);
      expect(screen.getByRole('combobox')).toBeDisabled();
    });
  });

  describe('variant="segmented"', () => {
    it('renders segmented buttons for PL and EN', () => {
      render(<LanguageSelect value="pl" onChange={vi.fn()} variant="segmented" />);

      const group = screen.getByRole('group');
      expect(group).toBeInTheDocument();

      const plBtn = screen.getByRole('button', { name: 'Polski' });
      const enBtn = screen.getByRole('button', { name: 'English' });

      expect(plBtn).toHaveTextContent('PL');
      expect(plBtn).toHaveAttribute('aria-pressed', 'true');

      expect(enBtn).toHaveTextContent('EN');
      expect(enBtn).toHaveAttribute('aria-pressed', 'false');
    });

    it('calls onChange with the selected language code when clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<LanguageSelect value="pl" onChange={onChange} variant="segmented" />);

      const enBtn = screen.getByRole('button', { name: 'English' });
      await user.click(enBtn);

      expect(onChange).toHaveBeenCalledWith('en');
    });

    it('disables buttons when disabled=true', () => {
      render(<LanguageSelect value="pl" onChange={vi.fn()} variant="segmented" disabled />);

      expect(screen.getByRole('button', { name: 'Polski' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'English' })).toBeDisabled();
    });
  });
});
