import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { test, expect, beforeEach } from 'vitest';
import { Sidebar } from './Sidebar';
import { resetStores, seedAuth } from '../../../test/utils';

beforeEach(() => {
  resetStores();
});

test('Sidebar renders nav links', () => {
  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  );
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
  expect(screen.getByText('Biblioteka')).toBeInTheDocument();
  expect(screen.getByText('Statystyki')).toBeInTheDocument();
  expect(screen.getByText('Dodaj sesję')).toBeInTheDocument();
  expect(screen.getByText('Sesja głosowa')).toBeInTheDocument();
  expect(screen.getByText('Kosz')).toBeInTheDocument();
  expect(screen.getByText('Ustawienia')).toBeInTheDocument();
});

test('Sidebar shows Administracja only for admins', () => {
  seedAuth(true);
  const { unmount } = render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  );
  expect(screen.getByText('Administracja')).toBeInTheDocument();
  unmount();

  resetStores();
  seedAuth(false);
  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  );
  expect(screen.queryByText('Administracja')).not.toBeInTheDocument();
});
