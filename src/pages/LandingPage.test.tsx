import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { test, expect, beforeEach } from 'vitest';
import { LandingPage } from './LandingPage';
import { renderAppRoutes, resetStores, seedAuth } from '../../test/utils';

beforeEach(() => {
  resetStores();
});

test('LandingPage renders ecosystem gateway sections', () => {
  renderAppRoutes(<Route path="/welcome" element={<LandingPage />} />, { route: '/welcome', authenticated: false });

  expect(screen.getByRole('heading', { level: 1, name: /dziennik rozgrywek/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Jak zacząć' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Co potrafi GameTrace' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Statystyki, które dostajesz' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Mapa aktywności' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Bot, aplikacja, przeglądarka' })).toBeInTheDocument();
  expect(screen.getByText('APLIKACJA')).toBeInTheDocument();
  expect(screen.getAllByText('PRZEGLĄDARKA').length).toBeGreaterThan(0);
  expect(screen.getByText(/nie na privie do bota/i)).toBeInTheDocument();
  expect(screen.getByText(/Jedno konto, te same sesje/i)).toBeInTheDocument();
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

  await user.click(screen.getByRole('button', { name: /Przejdź do logowania/i }));
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
