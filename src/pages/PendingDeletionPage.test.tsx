import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route } from 'react-router-dom';
import { PendingDeletionPage } from './PendingDeletionPage';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { server } from '../../test/server';
import { renderAppRoutes, resetStores } from '../../test/utils';
import { fixtures } from '../../test/fixtures';
import i18n from '../i18n';

const pending = { ...fixtures.pendingDeletion, days_left: 4 };

const routes = (
  <>
    <Route path="/account/pending-deletion" element={<PendingDeletionPage />} />
    <Route path="/" element={<p>dashboard</p>} />
    <Route path="/welcome" element={<p>welcome</p>} />
  </>
);

beforeEach(async () => {
  resetStores();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-08-10T12:00:00Z'));
  await i18n.changeLanguage('pl');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('PendingDeletionPage', () => {
  it('shows days left and the cancel caveats', () => {
    useAuthStore.getState().login('t', { discordId: '123', username: 'testuser' }, false, pending);
    renderAppRoutes(routes, { route: '/account/pending-deletion', authenticated: false });
    expect(screen.getByText('4 dni')).toBeInTheDocument();
    expect(screen.getByText(/nie wracają/)).toBeInTheDocument();
  });

  it('recomputes days left rather than showing the count persisted at login', () => {
    // The store rehydrates days_left from whenever the user last logged in.
    // Two days later that number is wrong; purge_at still is not.
    vi.setSystemTime(new Date('2026-08-12T12:00:00Z'));
    useAuthStore.getState().login('t', { discordId: '123', username: 'testuser' }, false, pending);
    renderAppRoutes(routes, { route: '/account/pending-deletion', authenticated: false });
    expect(screen.getByText('2 dni')).toBeInTheDocument();
    expect(screen.queryByText('4 dni')).not.toBeInTheDocument();
  });

  it('cancels, clears the flag and returns to the app', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().login('t', { discordId: '123', username: 'testuser' }, false, pending);
    renderAppRoutes(routes, { route: '/account/pending-deletion', authenticated: false });

    await user.click(screen.getByRole('button', { name: 'Anuluj usunięcie' }));

    await waitFor(() => expect(screen.getByText('dashboard')).toBeInTheDocument());
    expect(useAuthStore.getState().pendingDeletion).toBeNull();
    expect(useToastStore.getState().toasts[0].message).toBe('Usuwanie konta zostało anulowane.');
  });

  it('does not report success when nothing was scheduled (404)', async () => {
    const user = userEvent.setup();
    server.use(
      http.delete('/api/v1/profile/me/deletion', () =>
        HttpResponse.json({ detail: 'No deletion is scheduled for this account' }, { status: 404 }),
      ),
    );
    useAuthStore.getState().login('t', { discordId: '123', username: 'testuser' }, false, pending);
    renderAppRoutes(routes, { route: '/account/pending-deletion', authenticated: false });

    await user.click(screen.getByRole('button', { name: 'Anuluj usunięcie' }));

    await waitFor(() => expect(screen.getByText('dashboard')).toBeInTheDocument());
    expect(useAuthStore.getState().pendingDeletion).toBeNull();
    expect(useToastStore.getState().toasts[0].message).toBe('To konto nie jest zaplanowane do usunięcia.');
  });

  it('redirects to / when nothing is scheduled', () => {
    useAuthStore.getState().login('t', { discordId: '123', username: 'testuser' }, false, null);
    renderAppRoutes(routes, { route: '/account/pending-deletion', authenticated: false });
    expect(screen.getByText('dashboard')).toBeInTheDocument();
  });

  it('redirects to /welcome when signed out', () => {
    renderAppRoutes(routes, { route: '/account/pending-deletion', authenticated: false });
    expect(screen.getByText('welcome')).toBeInTheDocument();
  });
});
