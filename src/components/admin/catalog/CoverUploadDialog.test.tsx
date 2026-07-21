import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../test/server';
import { renderWithProviders, resetStores, seedAuth } from '../../../../test/utils';
import { CoverUploadDialog } from './CoverUploadDialog';

function makeFile() {
  return new File(['cover-bytes'], 'cover.png', { type: 'image/png' });
}

describe('CoverUploadDialog', () => {
  beforeEach(() => {
    resetStores();
    seedAuth();
  });

  it('disables the save control when no file is selected', () => {
    renderWithProviders(<CoverUploadDialog gameId={45} onClose={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Zapisz' })).toBeDisabled();
  });

  it('closes the dialog after a successful upload', async () => {
    const onClose = vi.fn();
    renderWithProviders(<CoverUploadDialog gameId={45} onClose={onClose} />);

    await userEvent.upload(screen.getByLabelText('Plik okładki'), makeFile());
    expect(screen.getByRole('button', { name: 'Zapisz' })).toBeEnabled();

    await userEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('keeps the dialog open with the selection intact when the upload fails', async () => {
    server.use(
      http.put('/api/v1/admin/games/:id/cover', () =>
        HttpResponse.json({ detail: 'Nieprawidłowy plik obrazu.' }, { status: 422 }),
      ),
    );
    const onClose = vi.fn();
    renderWithProviders(<CoverUploadDialog gameId={45} onClose={onClose} />);

    const input = screen.getByLabelText('Plik okładki') as HTMLInputElement;
    await userEvent.upload(input, makeFile());

    await userEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Zapisz' })).toBeEnabled());
    expect(onClose).not.toHaveBeenCalled();
    expect(input.files?.[0]?.name).toBe('cover.png');
    expect(screen.getByRole('button', { name: 'Zapisz' })).not.toBeDisabled();
  });
});
