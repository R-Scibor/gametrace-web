import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { test, expect, beforeEach } from 'vitest';
import { AdminRoute } from './AdminRoute';
import { resetStores, seedAuth } from '../../test/utils';

beforeEach(() => {
  resetStores();
});

function renderAdminRoute(isAdmin: boolean) {
  seedAuth(isAdmin);
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/" element={<div data-testid="home">Home</div>} />
        <Route path="/welcome" element={<div data-testid="welcome">Welcome</div>} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<div data-testid="admin">Admin</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

test('AdminRoute redirects non-admin to home', () => {
  renderAdminRoute(false);
  expect(screen.getByTestId('home')).toBeInTheDocument();
  expect(screen.queryByTestId('admin')).not.toBeInTheDocument();
});

test('AdminRoute allows admin through', () => {
  renderAdminRoute(true);
  expect(screen.getByTestId('admin')).toBeInTheDocument();
});