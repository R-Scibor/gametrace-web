import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, resetStores, seedAuth } from '../../../../test/utils';
import { server } from '../../../../test/server';
import { MergeSection } from './MergeSection';

describe('MergeSection', () => {
  const seen: string[] = [];

  beforeEach(() => {
    resetStores();
    seedAuth();
    seen.length = 0;
    server.events.on('request:start', ({ request }) => {
      seen.push(new URL(request.url).pathname);
    });
  });

  it('searches the global catalog rather than the personal library', async () => {
    renderWithProviders(<MergeSection gameId={45} onMerged={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Szukaj gry docelowej'), 'hades');

    await waitFor(() => expect(seen).toContain('/api/v1/admin/games'));
    expect(seen).not.toContain('/api/v1/games');
  });

  it('requires confirmation before sending the merge request', async () => {
    renderWithProviders(<MergeSection gameId={45} onMerged={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Szukaj gry docelowej'), 'nieznana');
    const candidate = await screen.findByText(/Nieznana Gra/);
    expect(candidate).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Scal tutaj' }));

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(seen).not.toContain('/api/v1/admin/games/45/merge/99');

    await userEvent.click(screen.getByRole('button', { name: 'Scal' }));

    await waitFor(() => expect(seen).toContain('/api/v1/admin/games/45/merge/99'));
  });

  it('calls onMerged with the target id after a successful merge', async () => {
    const onMerged = vi.fn();
    renderWithProviders(<MergeSection gameId={45} onMerged={onMerged} />);

    await userEvent.type(screen.getByLabelText('Szukaj gry docelowej'), 'nieznana');
    await screen.findByText(/Nieznana Gra/);

    await userEvent.click(screen.getByRole('button', { name: 'Scal tutaj' }));
    await userEvent.click(screen.getByRole('button', { name: 'Scal' }));

    await waitFor(() => expect(onMerged).toHaveBeenCalledWith(99));
  });
});
