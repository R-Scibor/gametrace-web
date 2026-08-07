import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { DeletionScheduledPage } from './DeletionScheduledPage';
import { saveScheduledDeletion } from '../lib/accountDeletion';
import { renderAppRoutes, resetStores } from '../../test/utils';
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
});
