import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { test, expect, beforeEach } from 'vitest';
import { LandingPage } from './LandingPage';
import { renderAppRoutes, resetStores, seedAuth } from '../../test/utils';

beforeEach(() => {
  resetStores();
});

test('LandingPage renders onboarding sections', () => {
  renderAppRoutes(<Route path="/welcome" element={<LandingPage />} />, { route: '/welcome', authenticated: false });

  expect(screen.getByRole('heading', { level: 1, name: /GameTrace/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Czym jest GameTrace?' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Jak zacząć?' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Jak korzystać?' })).toBeInTheDocument();
  expect(screen.getByText(/Wejdź na serwer z botem/i)).toBeInTheDocument();
  expect(screen.getByText(/nie na privie do bota/i)).toBeInTheDocument();
});

test('LandingPage navigates to login from CTA', async () => {
  const user = userEvent.setup();
  renderAppRoutes(
    <>
      <Route path="/welcome" element={<LandingPage />} />
      <Route path="/login" element={<div>Login Screen</div>} />
    </>,
    { route: '/welcome', authenticated: false },
  );

  await user.click(screen.getByRole('button', { name: /Zaloguj się/i }));
  expect(screen.getByText('Login Screen')).toBeInTheDocument();
});

test('LandingPage redirects authenticated users to dashboard', () => {
  seedAuth();
  renderAppRoutes(
    <>
      <Route path="/welcome" element={<LandingPage />} />
      <Route path="/" element={<div>Dashboard</div>} />
    </>,
    { route: '/welcome', authenticated: true },
  );

  expect(screen.getByText('Dashboard')).toBeInTheDocument();
});