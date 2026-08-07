import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DeletionScheduledPage } from './DeletionScheduledPage';
import { saveScheduledDeletion } from '../lib/accountDeletion';
import { useAuthStore } from '../store/authStore';
import { renderAppRoutes, resetStores, seedAuth } from '../../test/utils';
import i18n from '../i18n';

const status = {
  deletion_requested_at: '2026-08-07T12:00:00Z',
  purge_at: '2026-08-14T12:00:00Z',
  days_left: 7,
};

const routes = (
  <>
    <Route path="/account/deletion-scheduled" element={<DeletionScheduledPage />} />
    <Route path="/delete-account" element={<p>public info page</p>} />
  </>
);

beforeEach(async () => {
  resetStores();
  sessionStorage.clear();
  await i18n.changeLanguage('pl');
});

describe('DeletionScheduledPage', () => {
  it('ignores garbage router state and falls back to sessionStorage instead of "Invalid Date"', () => {
    saveScheduledDeletion(status);
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
    saveScheduledDeletion(status);
    renderAppRoutes(routes, { route: '/account/deletion-scheduled', authenticated: false });
    expect(screen.getByText(/14/)).toBeInTheDocument();
    expect(screen.getByText('7 dni')).toBeInTheDocument();
  });

  it('redirects to the public page when there is no status at all', () => {
    renderAppRoutes(routes, { route: '/account/deletion-scheduled', authenticated: false });
    expect(screen.getByText('public info page')).toBeInTheDocument();
  });

  it('explains how to cancel and offers no cancel button', () => {
    saveScheduledDeletion(status);
    renderAppRoutes(routes, { route: '/account/deletion-scheduled', authenticated: false });
    expect(screen.getByRole('link', { name: /Zaloguj się, aby anulować/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Anuluj usunięcie/ })).not.toBeInTheDocument();
  });

  it('tears down auth once mounted with a real status', () => {
    // This is where auth teardown actually happens now (moved out of
    // DeleteAccountDialog's onSuccess to avoid racing ProtectedRoute).
    saveScheduledDeletion(status);
    seedAuth();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    renderAppRoutes(routes, { route: '/account/deletion-scheduled', authenticated: false });

    expect(screen.getByText(/14/)).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('does not tear down auth when there is no status to show', () => {
    seedAuth();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    renderAppRoutes(routes, { route: '/account/deletion-scheduled', authenticated: false });

    expect(screen.getByText('public info page')).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
