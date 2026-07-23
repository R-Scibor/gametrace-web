import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach } from 'vitest';
import { Sidebar } from './Sidebar';
import {
  renderWithProviders,
  renderAppRoutes,
  resetStores,
  seedAuth,
  createTestQueryClient,
} from '../../../test/utils';
import { server } from '../../../test/server';
import { fixtures } from '../../../test/fixtures';
import { useAuthStore } from '../../store/authStore';

beforeEach(() => {
  resetStores();
});

test('Sidebar brand links to welcome page', () => {
  renderWithProviders(<Sidebar />, { authenticated: true });
  expect(screen.getByRole('link', { name: 'Strona powitalna GameTrace' })).toHaveAttribute(
    'href',
    '/welcome',
  );
});

test('Sidebar renders nav links', () => {
  renderWithProviders(<Sidebar />, { authenticated: true });
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
  const client = createTestQueryClient();
  const { unmount } = render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  expect(screen.getByText('Administracja')).toBeInTheDocument();
  unmount();

  resetStores();
  seedAuth(false);
  const client2 = createTestQueryClient();
  render(
    <QueryClientProvider client={client2}>
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    </QueryClientProvider>,
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

test('preview switch is hidden when the account has real data', async () => {
  renderWithProviders(<Sidebar />, { authenticated: true });
  await waitFor(() => {
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });
});

test('preview switch appears when the account is empty and toggling persists to authStore', async () => {
  server.use(
    http.get('/api/v1/stats/dashboard', () => HttpResponse.json(fixtures.dashboardNoActive)),
    http.get('/api/v1/sessions', () => HttpResponse.json([])),
  );
  const user = userEvent.setup();

  renderWithProviders(<Sidebar />, { authenticated: true });

  const toggle = await screen.findByRole('switch', { name: /podgląd przykładowy/i });
  expect(toggle).toHaveAttribute('aria-checked', 'true');

  await user.click(toggle);
  expect(toggle).toHaveAttribute('aria-checked', 'false');
  expect(useAuthStore.getState().previewDismissed).toBe(true);
});
