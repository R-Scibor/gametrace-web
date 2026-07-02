import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from './ProtectedRoute';
import { test, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/authStore';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { resetStores } from '../../test/utils';

beforeEach(() => {
  resetStores();
});

test('ProtectedRoute redirects to /welcome when unauthenticated', () => {
  render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
        <Route path="/welcome" element={<div>Welcome Page</div>} />
      </Routes>
    </MemoryRouter>,
  );

  expect(screen.getByText('Welcome Page')).toBeInTheDocument();
  expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
});

test('ProtectedRoute renders children when authenticated', () => {
  useAuthStore.getState().login('token', { discordId: '1', username: 'test' });

  render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

  expect(screen.getByText('Protected Content')).toBeInTheDocument();
});

test('ProtectedRoute shows loading gate before hydration completes', () => {
  useAuthStore.setState({
    token: 'saved-token',
    user: { discordId: '1', username: 'test' },
    isAuthenticated: true,
    hasHydrated: false,
  });

  const { container } = render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
        <Route path="/welcome" element={<div>Welcome Page</div>} />
      </Routes>
    </MemoryRouter>,
  );

  expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  expect(screen.queryByText('Welcome Page')).not.toBeInTheDocument();
  expect(container.querySelector('[class*="_skeleton_"]')).toBeTruthy();
});