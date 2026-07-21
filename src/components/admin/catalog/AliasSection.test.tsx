import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, resetStores, seedAuth } from '../../../../test/utils';
import { useToastStore } from '../../../store/toastStore';
import { AliasSection } from './AliasSection';

describe('AliasSection', () => {
  beforeEach(() => {
    resetStores();
    seedAuth();
  });

  it('lists existing aliases as chips', () => {
    renderWithProviders(<AliasSection gameId={1} aliases={['eldenring.exe', 'ELDEN RING']} />);

    expect(screen.getByText('eldenring.exe')).toBeInTheDocument();
    expect(screen.getByText('ELDEN RING')).toBeInTheDocument();
  });

  it('adds a new alias', async () => {
    renderWithProviders(<AliasSection gameId={1} aliases={[]} />);

    await userEvent.type(screen.getByLabelText('Nowy alias'), 'hades.exe');
    await userEvent.click(screen.getByRole('button', { name: 'Dodaj' }));

    await waitFor(() =>
      expect(useToastStore.getState().toasts.some((t) => t.message === 'Alias dodany.')).toBe(true),
    );
  });

  it('clears the input after a successful add', async () => {
    renderWithProviders(<AliasSection gameId={1} aliases={[]} />);

    const input = screen.getByLabelText('Nowy alias');
    await userEvent.type(input, 'hades.exe');
    await userEvent.click(screen.getByRole('button', { name: 'Dodaj' }));

    await waitFor(() => expect(input).toHaveValue(''));
  });

  it('does not submit on whitespace-only input', async () => {
    renderWithProviders(<AliasSection gameId={1} aliases={[]} />);

    await userEvent.type(screen.getByLabelText('Nowy alias'), '   ');
    await userEvent.click(screen.getByRole('button', { name: 'Dodaj' }));

    // Give any accidental request a tick to land, then assert nothing fired.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
