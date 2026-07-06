import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './LoginPage';
import { useAuthStore } from '../store/authStore';
import { server } from '../../test/server';
import { http, HttpResponse } from 'msw';
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

test('LoginPage renders link code form by default', () => {
  renderLogin();
  expect(screen.getByLabelText(/Kod logowania/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^ZALOGUJ SIĘ$/i })).toBeInTheDocument();
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

test('LoginPage handles successful username login in dev mode', async () => {
  server.use(
    http.post('/api/v1/auth/login', () => {
      return HttpResponse.json({
        token: 'test-token',
        discord_id: '123',
        username: 'test_user',
        timezone: 'UTC',
        is_admin: false,
      });
    }),
  );

  renderLogin();

  await userEvent.click(screen.getByRole('button', { name: /Zaloguj się nazwą/i }));

  const input = screen.getByLabelText(/Nazwa Użytkownika Discord/i);
  await userEvent.type(input, 'test_user');

  const button = screen.getByRole('button', { name: /^ZALOGUJ SIĘ$/i });
  await userEvent.click(button);

  expect(await screen.findByText('Home Page')).toBeInTheDocument();
});