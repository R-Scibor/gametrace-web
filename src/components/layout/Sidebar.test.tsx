import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route } from 'react-router-dom';
import { test, expect, beforeEach } from 'vitest';
import { Sidebar } from './Sidebar';
import { renderAppRoutes, resetStores, seedAuth } from '../../../test/utils';

beforeEach(() => {
  resetStores();
});

test('Sidebar brand links to welcome page', () => {
  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  );
  expect(screen.getByRole('link', { name: 'Strona powitalna GameTrace' })).toHaveAttribute('href', '/welcome');
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

test('Sidebar logout requires confirmation before navigating to login', async () => {
  const user = userEvent.setup();
  renderAppRoutes(
    <>
      <Route path="/" element={<Sidebar />} />
      <Route path="/login" element={<div>Login Screen</div>} />
    </>,
    { route: '/' },
  );

  await user.click(screen.getByRole('button', { name: /Wyloguj się/i }));
  const dialog = screen.getByRole('alertdialog');
  expect(within(dialog).getByText(/na pewno chcesz się wylogować/i)).toBeInTheDocument();

  await user.click(within(dialog).getByRole('button', { name: /^Wyloguj się$/i }));
  expect(await screen.findByText('Login Screen')).toBeInTheDocument();
});

test('Sidebar logout confirmation can be cancelled', async () => {
  const user = userEvent.setup();
  renderAppRoutes(
    <>
      <Route path="/" element={<Sidebar />} />
      <Route path="/login" element={<div>Login Screen</div>} />
    </>,
    { route: '/' },
  );

  await user.click(screen.getByRole('button', { name: /Wyloguj się/i }));
  await user.click(screen.getByRole('button', { name: /Anuluj/i }));

  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  expect(screen.queryByText('Login Screen')).not.toBeInTheDocument();
});
