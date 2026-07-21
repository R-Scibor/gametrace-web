import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../test/server';
import { renderWithProviders, resetStores, seedAuth } from '../../../../test/utils';
import { useToastStore } from '../../../store/toastStore';
import { IgdbLinkDialog } from './IgdbLinkDialog';

describe('IgdbLinkDialog', () => {
  beforeEach(() => {
    resetStores();
    seedAuth();
  });

  it('searches IGDB and links the chosen candidate', async () => {
    renderWithProviders(<IgdbLinkDialog gameId={45} gameName="Hades" onClose={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Szukaj' }));

    const candidate = await screen.findByRole('button', { name: /Powiąż/i });
    await userEvent.click(candidate);

    await waitFor(() =>
      expect(useToastStore.getState().toasts.some((t) => t.message === 'Gra powiązana z IGDB.')).toBe(
        true,
      ),
    );
  });

  it('offers a link to the conflicting game on 409', async () => {
    server.use(
      http.post('/api/v1/admin/games/:id/igdb-link', () =>
        HttpResponse.json({ detail: { conflicting_game_id: 88 } }, { status: 409 }),
      ),
    );

    renderWithProviders(<IgdbLinkDialog gameId={1} gameName="Hades" onClose={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Szukaj' }));
    await userEvent.click(await screen.findByRole('button', { name: /Powiąż/i }));

    await waitFor(() => {
      const toast = useToastStore.getState().toasts.find((t) => t.action);
      expect(toast?.action?.to).toBe('/admin/catalog?game=88');
    });
  });
});
