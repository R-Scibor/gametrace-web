import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route } from 'react-router-dom';
import { test, expect, beforeEach } from 'vitest';
import { LandingPage } from './LandingPage';
import { server } from '../../test/server';
import { renderAppRoutes, resetStores, seedAuth } from '../../test/utils';

beforeEach(() => {
  resetStores();
});

test('LandingPage renders ecosystem gateway sections', async () => {
  renderAppRoutes(<Route path="/welcome" element={<LandingPage />} />, { route: '/welcome', authenticated: false });

  expect(screen.getByRole('heading', { level: 1, name: /dziennik rozgrywek/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Jak zacząć' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Co potrafi GameTrace' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Statystyki, które dostajesz' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Mapa aktywności' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Bot, aplikacja, przeglądarka' })).toBeInTheDocument();
  expect(screen.getByText('APLIKACJA')).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getAllByRole('button', { name: /pobierz apk/i }).length).toBeGreaterThanOrEqual(1);
  });
  expect(screen.getAllByText('PRZEGLĄDARKA').length).toBeGreaterThan(0);
  expect(screen.getByText(/nie na privie/i)).toBeInTheDocument();
  expect(screen.getByText(/Jedno konto wszędzie/i)).toBeInTheDocument();
  expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  expect(screen.getByText('GAMETRACE', { selector: 'footer span' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /polityka prywatności/i })).toHaveAttribute(
    'href',
    '/privacy',
  );
});

test('LandingPage hides APK download when artifact is missing', async () => {
  server.use(http.get('/download/gametrace.apk', () => new HttpResponse(null, { status: 404 })));

  renderAppRoutes(<Route path="/welcome" element={<LandingPage />} />, { route: '/welcome', authenticated: false });

  await waitFor(() => {
    const apkButtons = screen.getAllByRole('button', { name: /pobierz apk/i });
    expect(apkButtons.length).toBeGreaterThan(0);
    apkButtons.forEach((btn) => expect(btn).toBeDisabled());
  });
});

test('LandingPage opens onboarding wizard from onboarding query param', async () => {
  renderAppRoutes(<Route path="/welcome" element={<LandingPage />} />, {
    route: '/welcome?onboarding=1',
    authenticated: false,
  });

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Uruchom GameTrace' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Zaproś bota albo dołącz na serwer' })).toBeInTheDocument();
});

test('LandingPage opens onboarding wizard from hero CTA', async () => {
  const user = userEvent.setup();
  renderAppRoutes(<Route path="/welcome" element={<LandingPage />} />, { route: '/welcome', authenticated: false });

  const [heroCta] = screen.getAllByRole('button', { name: /^Rozpocznij$/i });
  await user.click(heroCta);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Uruchom GameTrace' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Zaproś bota albo dołącz na serwer' })).toBeInTheDocument();
});

test('LandingPage opens onboarding wizard from Jak zacząć CTA', async () => {
  const user = userEvent.setup();
  renderAppRoutes(<Route path="/welcome" element={<LandingPage />} />, { route: '/welcome', authenticated: false });

  const stepsSection = document.getElementById('jak-zaczac');
  expect(stepsSection).not.toBeNull();

  await user.click(within(stepsSection!).getByRole('button', { name: /^Rozpocznij$/i }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Uruchom GameTrace' })).toBeInTheDocument();
});

test('LandingPage navigates to login from platform card', async () => {
  const user = userEvent.setup();
  renderAppRoutes(
    <>
      <Route path="/welcome" element={<LandingPage />} />
      <Route path="/login" element={<div>Login Screen</div>} />
    </>,
    { route: '/welcome', authenticated: false },
  );

  await user.click(screen.getByRole('button', { name: /Zaloguj w przeglądarce/i }));
  expect(screen.getByText('Login Screen')).toBeInTheDocument();
});

test('LandingPage keeps wizard as primary CTA when authenticated', async () => {
  seedAuth();
  const user = userEvent.setup();
  renderAppRoutes(
    <>
      <Route path="/welcome" element={<LandingPage />} />
      <Route path="/" element={<div>Dashboard</div>} />
    </>,
    { route: '/welcome', authenticated: true },
  );

  expect(screen.getAllByRole('button', { name: /^Rozpocznij$/i })).toHaveLength(2);
  await user.click(screen.getAllByRole('button', { name: /^Rozpocznij$/i })[0]);
  expect(screen.getByRole('dialog')).toBeInTheDocument();

  await user.click(screen.getByRole('link', { name: /Przejdź do Dashboard/i }));
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
});