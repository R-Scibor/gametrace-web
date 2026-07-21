import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, resetStores, seedAuth } from '../../../../test/utils';
import { useToastStore } from '../../../store/toastStore';
import { ActionsSection } from './ActionsSection';

describe('ActionsSection', () => {
  beforeEach(() => {
    resetStores();
    seedAuth();
  });

  it('queues enrichment', async () => {
    renderWithProviders(<ActionsSection gameId={1} gameName="Hades" />);

    await userEvent.click(screen.getByRole('button', { name: /Wzbogać/i }));

    await waitFor(() =>
      expect(
        useToastStore.getState().toasts.some((t) => t.message === 'Wzbogacanie dodane do kolejki.'),
      ).toBe(true),
    );
  });

  it('opens the IGDB dialog', async () => {
    renderWithProviders(<ActionsSection gameId={1} gameName="Hades" />);

    await userEvent.click(screen.getByRole('button', { name: /Powiąż z IGDB/i }));

    expect(await screen.findByRole('dialog', { name: 'Powiąż z IGDB' })).toBeInTheDocument();
  });
});
