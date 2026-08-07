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

  it('keeps confirm disabled for an empty username even after typing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeleteAccountDialog open username="" onClose={onClose} />);

    const confirm = screen.getByRole('button', { name: 'Usuń konto' });
    expect(confirm).toBeDisabled();

    await user.type(screen.getByLabelText(/Wpisz/), 'anything');
    expect(confirm).toBeDisabled();
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

  it('schedules deletion and stores the status without tearing down auth itself', async () => {
    // Auth teardown intentionally does NOT happen in this onSuccess handler
    // (see DeletionScheduledPage, which does it on mount instead) — doing it
    // here would flip isAuthenticated while ProtectedRoute is still mounted
    // on /settings, racing the deferred navigate() and potentially bouncing
    // the user to /welcome. See SettingsPage.test.tsx for the end-to-end
    // regression test that guards this.
    const user = userEvent.setup();
    renderWithProviders(<DeleteAccountDialog open username="testuser" onClose={onClose} />, {
      authenticated: true,
    });

    await user.type(screen.getByLabelText(/Wpisz testuser/), 'testuser');
    await user.click(screen.getByRole('button', { name: 'Usuń konto' }));

    await waitFor(() => expect(readScheduledDeletion()?.days_left).toBe(7));
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
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

  it('clears a stale error banner once a retry is in flight', async () => {
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

    server.use(
      http.post('/api/v1/profile/me/deletion', () =>
        HttpResponse.json(
          { deletion_requested_at: '2026-08-07T12:00:00Z', purge_at: '2026-08-14T12:00:00Z', days_left: 7 },
          { status: 202 },
        ),
      ),
    );
    await user.click(screen.getByRole('button', { name: 'Usuń konto' }));

    expect(
      screen.queryByText('Nie udało się zlecić usunięcia konta. Spróbuj ponownie.'),
    ).not.toBeInTheDocument();
  });
});
