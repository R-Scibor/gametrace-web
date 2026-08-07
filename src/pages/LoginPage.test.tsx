import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { LoginPage } from './LoginPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuthStore } from '../store/authStore';
import { server } from '../../test/server';
import { fixtures } from '../../test/fixtures';
import { renderAppRoutes } from '../../test/utils';
import { test, expect, beforeEach } from 'vitest';

function renderLogin(route = '/login') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthStore.getState().logout();
});

test('LoginPage title links to welcome page', () => {
  renderLogin();
  expect(screen.getByRole('link', { name: 'Strona powitalna GameTrace' })).toHaveAttribute(
    'href',
    '/welcome',
  );
});

test('LoginPage renders link code form by default', () => {
  renderLogin();
  expect(screen.getByLabelText(/Kod logowania/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^ZALOGUJ SIĘ$/i })).toBeInTheDocument();
  expect(screen.getByText(/Skąd wziąć kod/i)).toBeInTheDocument();
  expect(screen.getByText(/nie na privie do bota/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /konfiguracji na stronie powitalnej/i })).toHaveAttribute(
    'href',
    '/welcome?onboarding=1',
  );
});

test('LoginPage redirects if already authenticated', () => {
  useAuthStore.getState().login('token', { discordId: '1', username: 'test' });
  renderLogin();
  expect(screen.getByText('Home Page')).toBeInTheDocument();
});

test('LoginPage handles successful link login', async () => {
  renderLogin();

  const input = screen.getByLabelText(/Kod logowania/i);
  await userEvent.type(input, '231996');

  const button = screen.getByRole('button', { name: /^ZALOGUJ SIĘ$/i });
  await userEvent.click(button);

  expect(await screen.findByText('Home Page')).toBeInTheDocument();
});

test('LoginPage reaches protected home through ProtectedRoute', async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<div>Dashboard Home</div>} />
          </Route>
          <Route path="/welcome" element={<div>Welcome Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

  await userEvent.type(screen.getByLabelText(/Kod logowania/i), '231996');
  await userEvent.click(screen.getByRole('button', { name: /^ZALOGUJ SIĘ$/i }));

  expect(await screen.findByText('Dashboard Home')).toBeInTheDocument();
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
});

test('sends a scheduled account to the blocking screen instead of the dashboard', async () => {
  const user = userEvent.setup();
  server.use(
    http.post('/api/v1/auth/link', () =>
      HttpResponse.json({
        token: 'test-token',
        discord_id: '123',
        username: 'testuser',
        timezone: 'Europe/Warsaw',
        is_admin: false,
        pending_deletion: fixtures.pendingDeletion,
      }),
    ),
  );

  renderAppRoutes(
    <>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<p>dashboard</p>} />
      <Route path="/account/pending-deletion" element={<p>blocking screen</p>} />
    </>,
    { route: '/login', authenticated: false },
  );

  await user.type(screen.getByLabelText(/kod/i), '231996');
  await user.click(screen.getByRole('button', { name: /zaloguj/i }));

  await waitFor(() => expect(screen.getByText('blocking screen')).toBeInTheDocument());
});
