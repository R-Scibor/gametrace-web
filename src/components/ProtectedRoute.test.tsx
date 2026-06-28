import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from './ProtectedRoute';
import { test, expect } from 'vitest';
import { useAuthStore } from '../store/authStore';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

test('ProtectedRoute redirects to /login when unauthenticated', () => {
  useAuthStore.getState().logout();

  render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByText('Login Page')).toBeInTheDocument();
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
    </MemoryRouter>
  );

  expect(screen.getByText('Protected Content')).toBeInTheDocument();
});
