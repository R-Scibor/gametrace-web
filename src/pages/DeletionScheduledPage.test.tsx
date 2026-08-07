import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DeletionScheduledPage } from './DeletionScheduledPage';
import { saveScheduledDeletion } from '../lib/accountDeletion';
import { useAuthStore } from '../store/authStore';
import { renderAppRoutes, resetStores, seedAuth } from '../../test/utils';
import { fixtures } from '../../test/fixtures';
import i18n from '../i18n';

const routes = (
  <>
    <Route path="/account/deletion-scheduled" element={<DeletionScheduledPage />} />
    <Route path="/delete-account" element={<p>public info page</p>} />
  </>
);

beforeEach(async () => {
  resetStores();
  // Days left is derived from purge_at now, so the assertions below need a
  // fixed "now". Date only — the rest of the suite needs real timers.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-08-07T12:00:00Z'));
  await i18n.changeLanguage('pl');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('DeletionScheduledPage', () => {
  it('ignores garbage router state and falls back to sessionStorage instead of "Invalid Date"', () => {
    saveScheduledDeletion(fixtures.pendingDeletion);
    render(
      <MemoryRouter
        initialEntries={[{ pathname: '/account/deletion-scheduled', state: { from: '/settings' } }]}
      >
        <Routes>{routes}</Routes>
      </MemoryRouter>,
    );
    expect(screen.queryByText('Invalid Date')).not.toBeInTheDocument();
    expect(screen.getByText(/14/)).toBeInTheDocument();
  });

  it('redirects to the public page when router state is garbage and sessionStorage is empty', () => {
    render(
      <MemoryRouter
        initialEntries={[{ pathname: '/account/deletion-scheduled', state: { from: '/settings' } }]}
      >
        <Routes>{routes}</Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('public info page')).toBeInTheDocument();
  });

  it('recovers the status from sessionStorage when router state is gone', () => {
    saveScheduledDeletion(fixtures.pendingDeletion);
    renderAppRoutes(routes, { route: '/account/deletion-scheduled', authenticated: false });
    expect(screen.getByText(/14/)).toBeInTheDocument();
    expect(screen.getByText('7 dni')).toBeInTheDocument();
  });

  it('redirects to the public page when there is no status at all', () => {
    renderAppRoutes(routes, { route: '/account/deletion-scheduled', authenticated: false });
    expect(screen.getByText('public info page')).toBeInTheDocument();
  });

  it('explains how to cancel and offers no cancel button', () => {
    saveScheduledDeletion(fixtures.pendingDeletion);
    renderAppRoutes(routes, { route: '/account/deletion-scheduled', authenticated: false });
    expect(screen.getByRole('link', { name: /Zaloguj się, aby anulować/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Anuluj usunięcie/ })).not.toBeInTheDocument();
  });

  it('tears down auth once mounted with a real status', () => {
    // This is where auth teardown actually happens now (moved out of
    // DeleteAccountDialog's onSuccess to avoid racing ProtectedRoute).
    saveScheduledDeletion(fixtures.pendingDeletion);
    seedAuth();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    renderAppRoutes(routes, { route: '/account/deletion-scheduled', authenticated: false });

    expect(screen.getByText(/14/)).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('does not tear down auth on a later mount, so Back after logging in keeps the new token', () => {
    // Schedule, land here (teardown), then log in again to cancel and press
    // Back. The sessionStorage entry is still there; it must not sign them out.
    saveScheduledDeletion(fixtures.pendingDeletion);
    renderAppRoutes(routes, { route: '/account/deletion-scheduled', authenticated: false });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    seedAuth();
    renderAppRoutes(
      <>
        {routes}
        <Route path="/" element={<p>app shell</p>} />
      </>,
      { route: '/account/deletion-scheduled', authenticated: false },
    );

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(screen.getByText('app shell')).toBeInTheDocument();
  });

  it('does not tear down auth when there is no status to show', () => {
    seedAuth();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    renderAppRoutes(routes, { route: '/account/deletion-scheduled', authenticated: false });

    expect(screen.getByText('public info page')).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
