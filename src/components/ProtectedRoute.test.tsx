import { describe, it, expect, beforeEach } from 'vitest';
import { act, screen } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '../store/authStore';
import { renderAppRoutes, resetStores } from '../../test/utils';

const pending = {
  deletion_requested_at: '2026-08-07T12:00:00Z',
  purge_at: '2026-08-14T12:00:00Z',
  days_left: 7,
};

beforeEach(() => {
  resetStores();
});

const routes = (
  <>
    <Route element={<ProtectedRoute />}>
      <Route path="/" element={<p>dashboard</p>} />
    </Route>
    <Route path="/welcome" element={<p>welcome</p>} />
    <Route path="/account/pending-deletion" element={<p>blocking screen</p>} />
  </>
);

describe('ProtectedRoute', () => {
  it('sends unauthenticated users to /welcome', () => {
    renderAppRoutes(routes, { route: '/', authenticated: false });
    expect(screen.getByText('welcome')).toBeInTheDocument();
  });

  it('renders the app for a normal authenticated user', () => {
    renderAppRoutes(routes, { route: '/', authenticated: true });
    expect(screen.getByText('dashboard')).toBeInTheDocument();
  });

  it('sends a scheduled account to the blocking screen', () => {
    renderAppRoutes(routes, { route: '/', authenticated: true });
    act(() => {
      useAuthStore.getState().setPendingDeletion(pending);
    });
    // re-render happens via the store subscription
    expect(screen.getByText('blocking screen')).toBeInTheDocument();
  });

  it('checks auth before pendingDeletion', () => {
    useAuthStore.setState({ pendingDeletion: pending });
    renderAppRoutes(routes, { route: '/', authenticated: false });
    expect(screen.getByText('welcome')).toBeInTheDocument();
  });
});
