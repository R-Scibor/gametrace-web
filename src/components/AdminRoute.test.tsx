import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach } from 'vitest';
import { AdminRoute } from './AdminRoute';
import { server } from '../../test/server';
import { fixtures } from '../../test/fixtures';
import { useAuthStore } from '../store/authStore';
import { resetStores, seedAuth, createTestQueryClient } from '../../test/utils';

beforeEach(() => {
  resetStores();
});

function mockProfileIsAdmin(isAdmin: boolean) {
  server.use(
    http.get('/api/v1/profile/me', () =>
      HttpResponse.json({ ...fixtures.profileMe, is_admin: isAdmin }),
    ),
  );
}

function renderAdminRoute() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/" element={<div data-testid="home">Home</div>} />
          <Route path="/welcome" element={<div data-testid="welcome">Welcome</div>} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<div data-testid="admin">Admin</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

test('AdminRoute redirects unauthenticated visitors to welcome', () => {
  renderAdminRoute();
  expect(screen.getByTestId('welcome')).toBeInTheDocument();
});

test('AdminRoute redirects non-admin to home', async () => {
  mockProfileIsAdmin(false);
  seedAuth(false);
  renderAdminRoute();

  await waitFor(() => {
    expect(screen.getByTestId('home')).toBeInTheDocument();
  });
  expect(screen.queryByTestId('admin')).not.toBeInTheDocument();
});

test('AdminRoute allows admin through', async () => {
  mockProfileIsAdmin(true);
  seedAuth(true);
  renderAdminRoute();

  expect(await screen.findByTestId('admin')).toBeInTheDocument();
});

// On a hard refresh the persisted token survives but isAdmin is reset to false,
// so it must be re-read from GET /profile/me before the guard can decide.
test('AdminRoute waits for profile instead of redirecting an admin mid-hydration', async () => {
  mockProfileIsAdmin(true);
  useAuthStore.setState({
    token: 'test-token',
    user: { discordId: '123', username: 'testuser' },
    isAuthenticated: true,
    isAdmin: false,
  });

  renderAdminRoute();

  expect(await screen.findByTestId('admin')).toBeInTheDocument();
  expect(screen.queryByTestId('home')).not.toBeInTheDocument();
});
