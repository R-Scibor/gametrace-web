import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import { readScheduledDeletion } from '../../lib/accountDeletion';
import { useAuthStore } from '../../store/authStore';
import { server } from '../../../test/server';
import { renderWithProviders, resetStores } from '../../../test/utils';
import i18n from '../../i18n';

const onClose = vi.fn();

beforeEach(async () => {
  resetStores();
  sessionStorage.clear();
  onClose.mockClear();
  await i18n.changeLanguage('pl');
});

describe('DeleteAccountDialog', () => {
  it('keeps confirm disabled until the username matches', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeleteAccountDialog open username="testuser" onClose={onClose} />);

    const confirm = screen.getByRole('button', { name: 'Usuń konto' });
    expect(confirm).toBeDisabled();

    await user.type(screen.getByLabelText(/Wpisz testuser/), 'testus');
    expect(confirm).toBeDisabled();

    await user.type(screen.getByLabelText(/Wpisz testuser/), 'er');
    expect(confirm).toBeEnabled();
  });

  it('accepts a trimmed, differently-cased username', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeleteAccountDialog open username="testuser" onClose={onClose} />);

    await user.type(screen.getByLabelText(/Wpisz testuser/), '  TestUser  ');
    expect(screen.getByRole('button', { name: 'Usuń konto' })).toBeEnabled();
  });

  it('lists the inventory without claiming the catalogue is deleted', () => {
    renderWithProviders(<DeleteAccountDialog open username="testuser" onClose={onClose} />);
    expect(screen.getByText(/Sesje gry i cała historia grania/)).toBeInTheDocument();
    expect(screen.getByText(/katalog gier nie zawiera/i)).toBeInTheDocument();
  });

  it('schedules deletion, stores the status and tears down auth', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeleteAccountDialog open username="testuser" onClose={onClose} />, {
      authenticated: true,
    });

    await user.type(screen.getByLabelText(/Wpisz testuser/), 'testuser');
    await user.click(screen.getByRole('button', { name: 'Usuń konto' }));

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(false));
    expect(readScheduledDeletion()?.days_left).toBe(7);
  });

  it('shows an error and keeps the user signed in when the request fails', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/v1/profile/me/deletion', () =>
        HttpResponse.json({ detail: 'Admin accounts cannot self-delete' }, { status: 403 }),
      ),
    );
    renderWithProviders(<DeleteAccountDialog open username="testuser" onClose={onClose} />, {
      authenticated: true,
    });

    await user.type(screen.getByLabelText(/Wpisz testuser/), 'testuser');
    await user.click(screen.getByRole('button', { name: 'Usuń konto' }));

    await waitFor(() =>
      expect(screen.getByText('Nie udało się zlecić usunięcia konta. Spróbuj ponownie.')).toBeInTheDocument(),
    );
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
