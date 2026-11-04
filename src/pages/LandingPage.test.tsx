import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route } from 'react-router-dom';
import { test, expect, beforeEach } from 'vitest';
import i18n from '../i18n';
import { LandingPage } from './LandingPage';
import { server } from '../../test/server';
import { renderAppRoutes, resetStores, seedAuth } from '../../test/utils';

beforeEach(() => {
  resetStores();
});

test('LandingPage renders ecosystem gateway sections', async () => {
  renderAppRoutes(<Route path="/welcome" element={<LandingPage />} />, { route: '/welcome', authenticated: false });

  expect(screen.getByRole('heading', { level: 1, name: /każda godzina gry/i })).toBeInTheDocument();
  const baldurs = screen.getByRole('complementary', { name: /Baldur’s Gate 3/i });
  expect(within(baldurs).getByText('Wykryto przez bota')).toBeInTheDocument();
  expect(within(baldurs).getByText('2h 14m')).toBeInTheDocument();
  expect(within(baldurs).getByText('8')).toBeInTheDocument();
  expect(within(baldurs).getByText('1h 40m')).toBeInTheDocument();
  expect(within(baldurs).getByRole('presentation')).toHaveAttribute('src', '/landing/baldurs-gate-3.jpg');
  const kingdom = screen.getByRole('complementary', { name: /Kingdom Come: Deliverance II/i });
  expect(within(kingdom).getByText('3h 05m')).toBeInTheDocument();
  expect(within(kingdom).getByText('5')).toBeInTheDocument();
  expect(within(kingdom).getByText('2h 20m')).toBeInTheDocument();
  expect(within(kingdom).getByRole('presentation')).toHaveAttribute('src', '/landing/kingdom-come-deliverance-2.jpg');
  expect(screen.queryByText('this-week')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Jak zacząć' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Co potrafi GameTrace' })).toBeInTheDocument();
  expect(screen.getByText('84')).toBeInTheDocument();
  expect(screen.getByText('1 320')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Mapa aktywności' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Bot, aplikacja, przeglądarka' })).toBeInTheDocument();
  expect(screen.getByText('APLIKACJA')).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getAllByRole('button', { name: /pobierz apk/i }).length).toBeGreaterThanOrEqual(1);
  });
  expect(screen.getAllByText('PRZEGLĄDARKA').length).toBeGreaterThan(0);
  expect(screen.getByText(/komendą \/login na kanale/i)).toBeInTheDocument();
  expect(screen.getByText(/Otwórz panel w przeglądarce lub pobierz aplikację/i)).toBeInTheDocument();
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

  await user.click(screen.getByRole('button', { name: /^Rozpocznij$/i }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Uruchom GameTrace' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Zaproś bota albo dołącz na serwer' })).toBeInTheDocument();
});

test('LandingPage keeps start out of the steps section', () => {
  renderAppRoutes(<Route path="/welcome" element={<LandingPage />} />, { route: '/welcome', authenticated: false });

  const stepsSection = document.getElementById('jak-zaczac');
  expect(stepsSection).not.toBeNull();
  expect(within(stepsSection!).queryByRole('button', { name: /^Rozpocznij$/i })).not.toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /^Rozpocznij$/i })).toHaveLength(1);
  expect(screen.queryByRole('link', { name: /mam już konto/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /dowiedz się więcej/i })).not.toBeInTheDocument();
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

  const platforms = document.getElementById('platformy');
  expect(platforms).not.toBeNull();
  await user.click(within(platforms!).getByRole('button', { name: /^Zaloguj się$/i }));
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

  expect(screen.getAllByRole('button', { name: /^Rozpocznij$/i })).toHaveLength(1);
  await user.click(screen.getByRole('button', { name: /^Rozpocznij$/i }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /Zamknij/i }));
  await user.click(screen.getAllByRole('button', { name: /^Dashboard$/i })[0]);
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
});

test('LandingPage translates feature preview cards when language is English', async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
  const { unmount } = renderAppRoutes(<Route path="/welcome" element={<LandingPage />} />, {
    route: '/welcome',
    authenticated: false,
  });

  // Auto-Detect
  expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  expect(screen.getByText('Game process detected • PC')).toBeInTheDocument();
  expect(screen.getByText('IN-GAME')).toBeInTheDocument();
  expect(screen.getByText('Playtime is logged to your account when the game closes')).toBeInTheDocument();

  // Voice
  expect(screen.getByText('“The Witcher 3, two hours, Baron quest”')).toBeInTheDocument();
  expect(screen.getByText('RECOGNIZED GAME')).toBeInTheDocument();
  expect(screen.getByText('The Witcher 3: Wild Hunt')).toBeInTheDocument();
  expect(screen.getByText('SESSION TIME')).toBeInTheDocument();
  expect(screen.getByText('Transcription is automatically saved into the session note')).toBeInTheDocument();

  // Library
  expect(screen.getAllByText('IGDB CATALOG').length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText('GAME COLLECTION')).toBeInTheDocument();
  expect(screen.getByText('12 days')).toBeInTheDocument();
  expect(screen.getByText('18 sessions')).toBeInTheDocument();
  expect(screen.getByText('5 sessions')).toBeInTheDocument();

  // Heatmap
  expect(screen.getByText('LAST 16 WEEKS')).toBeInTheDocument();
  expect(screen.getByText('Less')).toBeInTheDocument();
  expect(screen.getByText('More')).toBeInTheDocument();
  expect(screen.getByText('🔥 12 DAYS')).toBeInTheDocument();

  unmount();
  await act(async () => {
    await i18n.changeLanguage('pl');
  });
});

test('LandingPage header segmented language toggle switches language', async () => {
  const user = userEvent.setup();
  const { unmount } = renderAppRoutes(<Route path="/welcome" element={<LandingPage />} />, {
    route: '/welcome',
    authenticated: false,
  });

  const enBtn = screen.getByRole('button', { name: 'English' });
  expect(enBtn).toHaveAttribute('aria-pressed', 'false');

  await user.click(enBtn);

  expect(enBtn).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Polski' })).toHaveAttribute('aria-pressed', 'false');

  unmount();
  await act(async () => {
    await i18n.changeLanguage('pl');
  });
});
