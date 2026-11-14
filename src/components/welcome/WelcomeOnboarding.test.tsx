import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { test, expect, beforeEach, afterEach, vi } from 'vitest';
import { WelcomeOnboarding } from './WelcomeOnboarding';
import i18n from '../../i18n';
import * as discordOAuth from '../../lib/discordOAuth';
import { renderAppRoutes, resetStores } from '../../../test/utils';

beforeEach(() => {
  resetStores();
  vi.stubGlobal('open', vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

test('WelcomeOnboarding step 1 opens bot invite and advances', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();

  renderAppRoutes(
    <Route
      path="/welcome"
      element={
        <WelcomeOnboarding
          open
          onClose={onClose}
          apkAvailable={false}
          isAuthenticated={false}
          onApkUnavailable={vi.fn()}
        />
      }
    />,
    {
      route: '/welcome',
      authenticated: false,
    },
  );

  const joinServerBtn = screen.getByRole('button', { name: /Dołącz do serwera GameTrace/i });
  const addBotBtn = screen.getByRole('button', { name: /Dodaj bota do swojego serwera/i });
  const nextBtn = screen.getByRole('button', { name: /Jestem już na serwerze z botem/i });

  expect(joinServerBtn).toBeInTheDocument();
  expect(addBotBtn).toBeInTheDocument();
  expect(nextBtn).toBeInTheDocument();

  await user.click(addBotBtn);
  expect(window.open).toHaveBeenCalledWith(
    'https://discord.com/oauth2/authorize?client_id=test&permissions=2048&integration_type=0&scope=bot+applications.commands',
    '_blank',
    'noopener,noreferrer',
  );

  await user.click(nextBtn);
  expect(screen.getByRole('heading', { name: 'Jak chcesz założyć konto' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Mam już kod/i })).toBeInTheDocument();
});

test('WelcomeOnboarding step 1 opens public server join invite', async () => {
  const user = userEvent.setup();

  renderAppRoutes(
    <Route
      path="/welcome"
      element={
        <WelcomeOnboarding
          open
          onClose={vi.fn()}
          apkAvailable={false}
          isAuthenticated={false}
          onApkUnavailable={vi.fn()}
        />
      }
    />,
    {
      route: '/welcome',
      authenticated: false,
    },
  );

  const joinServerBtn = screen.getByRole('button', { name: /Dołącz do serwera GameTrace/i });

  await user.click(joinServerBtn);
  expect(window.open).toHaveBeenCalledWith(
    'https://discord.gg/test-invite',
    '_blank',
    'noopener,noreferrer',
  );
  expect(screen.getByText(/po dołączeniu do serwera wróć tutaj/i)).toBeInTheDocument();
});

test('WelcomeOnboarding shows bot hint after invite and supports back navigation', async () => {
  const user = userEvent.setup();

  renderAppRoutes(
    <Route
      path="/welcome"
      element={
        <WelcomeOnboarding
          open
          onClose={vi.fn()}
          apkAvailable={false}
          isAuthenticated={false}
          onApkUnavailable={vi.fn()}
        />
      }
    />,
    {
      route: '/welcome',
      authenticated: false,
    },
  );

  expect(screen.queryByText(/po dodaniu bota do swojego serwera/i)).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Dodaj bota do swojego serwera/i }));
  expect(screen.getByText(/po dodaniu bota do swojego serwera/i)).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /Jestem już na serwerze z botem/i }));
  await user.click(screen.getByRole('button', { name: /Wstecz/i }));
  expect(screen.getByRole('heading', { name: 'Dodaj bota lub dołącz do serwera' })).toBeInTheDocument();
  expect(screen.getByText(/po dodaniu bota do swojego serwera/i)).toBeInTheDocument();
});

test('WelcomeOnboarding step 2 explains panel flow and mentions /login fallback', async () => {
  const user = userEvent.setup();

  const { unmount } = renderAppRoutes(
    <Route
      path="/welcome"
      element={
        <WelcomeOnboarding
          open
          onClose={vi.fn()}
          apkAvailable={false}
          isAuthenticated={false}
          onApkUnavailable={vi.fn()}
        />
      }
    />,
    {
      route: '/welcome',
      authenticated: false,
    },
  );

  await user.click(screen.getByRole('button', { name: /Jestem już na serwerze z botem/i }));

  // Default locale (PL): shows ▶ START, both buttons, /login fallback
  expect(screen.getByText(/▶ START/)).toBeInTheDocument();
  expect(screen.getByText(/🔑 Get a code/)).toBeInTheDocument();
  expect(screen.getByText(/🔑 Weź kod/)).toBeInTheDocument();
  expect(screen.getByText(/Możesz też wpisać \/login na kanale serwera\./i)).toBeInTheDocument();

  // have-code button still works
  const haveCodeBtn = screen.getByRole('button', { name: /Mam już kod/i });
  expect(haveCodeBtn).toBeInTheDocument();
  await user.click(haveCodeBtn);
  expect(screen.getByRole('heading', { name: 'Przeglądarka' })).toBeInTheDocument();

  unmount();

  // English locale: shows ▶ START, both buttons, /login fallback
  await i18n.changeLanguage('en');
  try {
    renderAppRoutes(
      <Route
        path="/welcome"
        element={
          <WelcomeOnboarding
            open
            onClose={vi.fn()}
            apkAvailable={false}
            isAuthenticated={false}
            onApkUnavailable={vi.fn()}
          />
        }
      />,
      {
        route: '/welcome',
        authenticated: false,
      },
    );

    await user.click(screen.getByRole('button', { name: /I am already on a server with the bot/i }));
    expect(screen.getByText(/▶ START/)).toBeInTheDocument();
    expect(screen.getByText(/🔑 Get a code/)).toBeInTheDocument();
    expect(screen.getByText(/🔑 Weź kod/)).toBeInTheDocument();
    expect(screen.getByText(/You can also type \/login on a server channel\./i)).toBeInTheDocument();
    const haveCodeBtnEn = screen.getByRole('button', { name: /I already have a code/i });
    expect(haveCodeBtnEn).toBeInTheDocument();
    await user.click(haveCodeBtnEn);
    expect(screen.getByRole('heading', { name: 'Browser' })).toBeInTheDocument();
  } finally {
    await i18n.changeLanguage('pl');
  }
});

test('WelcomeOnboarding step 2 advances to client picker', async () => {
  const user = userEvent.setup();

  renderAppRoutes(
    <Route
      path="/welcome"
      element={
        <WelcomeOnboarding
          open
          onClose={vi.fn()}
          apkAvailable={true}
          isAuthenticated={false}
          onApkUnavailable={vi.fn()}
        />
      }
    />,
    {
      route: '/welcome',
      authenticated: false,
    },
  );

  await user.click(screen.getByRole('button', { name: /Jestem już na serwerze z botem/i }));
  await user.click(screen.getByRole('button', { name: /Mam już kod/i }));

  expect(screen.getByRole('heading', { name: 'Przeglądarka' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Zaloguj w przeglądarce/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Pobierz apk/i })).toBeInTheDocument();
});

test('WelcomeOnboarding browser client navigates to login', async () => {
  const user = userEvent.setup();

  renderAppRoutes(
    <>
      <Route
        path="/welcome"
        element={
          <WelcomeOnboarding
            open
            onClose={vi.fn()}
            apkAvailable={false}
            isAuthenticated={false}
            onApkUnavailable={vi.fn()}
          />
        }
      />
      <Route path="/login" element={<div>Login Screen</div>} />
    </>,
    { route: '/welcome', authenticated: false },
  );

  await user.click(screen.getByRole('button', { name: /Jestem już na serwerze z botem/i }));
  await user.click(screen.getByRole('button', { name: /Mam już kod/i }));
  await user.click(screen.getByRole('button', { name: /Zaloguj w przeglądarce/i }));

  expect(screen.getByText('Login Screen')).toBeInTheDocument();
});

test('WelcomeOnboarding step 3 toggles QR code preview on android client', async () => {
  const user = userEvent.setup();
  renderAppRoutes(
    <Route
      path="/welcome"
      element={
        <WelcomeOnboarding
          open
          onClose={vi.fn()}
          apkAvailable={true}
          isAuthenticated={false}
          onApkUnavailable={vi.fn()}
        />
      }
    />,
    { route: '/welcome', authenticated: false },
  );

  await user.click(screen.getByRole('button', { name: /Jestem już na serwerze z botem/i }));
  await user.click(screen.getByRole('button', { name: /Mam już kod/i }));

  const qrToggleBtn = screen.getByRole('button', { name: /Kod QR/i });
  expect(qrToggleBtn).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Pobierz APK/i })).toBeInTheDocument();

  expect(screen.getByAltText(/Aplikacja GameTrace na Androidzie/i)).toBeInTheDocument();

  await user.click(qrToggleBtn);
  expect(screen.getByRole('button', { name: /Podgląd/i })).toBeInTheDocument();
  expect(screen.queryByAltText(/Aplikacja GameTrace na Androidzie/i)).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /Podgląd/i }));
  expect(screen.getByRole('button', { name: /Kod QR/i })).toBeInTheDocument();
  expect(screen.getByAltText(/Aplikacja GameTrace na Androidzie/i)).toBeInTheDocument();
});

test('Discord choice opens the shared-server confirm and does not redirect yet', async () => {
  const redirectSpy = vi.spyOn(discordOAuth, 'redirectToDiscord').mockResolvedValue();
  const user = userEvent.setup();
  renderAppRoutes(
    <Route
      path="/welcome"
      element={
        <WelcomeOnboarding
          open
          onClose={vi.fn()}
          apkAvailable={false}
          isAuthenticated={false}
          onApkUnavailable={vi.fn()}
        />
      }
    />,
    { route: '/welcome', authenticated: false },
  );
  await user.click(screen.getByRole('button', { name: /Jestem już na serwerze z botem/i }));
  await user.click(screen.getByRole('button', { name: /Zaloguj przez Discorda/i }));
  expect(screen.getByRole('button', { name: /Przejdź do Discorda/i })).toBeInTheDocument();
  expect(screen.getByText(/Zaraz otworzy się Discord/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Mam już kod/i })).not.toBeInTheDocument();
  expect(redirectSpy).not.toHaveBeenCalled();
});

test('back button returns from code mode and from discord mode to choose, then to step 1', async () => {
  const user = userEvent.setup();
  renderAppRoutes(
    <Route
      path="/welcome"
      element={
        <WelcomeOnboarding
          open
          onClose={vi.fn()}
          apkAvailable={false}
          isAuthenticated={false}
          onApkUnavailable={vi.fn()}
        />
      }
    />,
    { route: '/welcome', authenticated: false },
  );
  // From step 1 to step 2 (shows code / panel flow)
  await user.click(screen.getByRole('button', { name: /Jestem już na serwerze z botem/i }));
  expect(screen.getByRole('heading', { name: 'Jak chcesz założyć konto' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Mam już kod/i })).toBeInTheDocument();

  // Back from step 2 to step 1
  await user.click(screen.getByRole('button', { name: /Wstecz/i }));
  expect(screen.getByRole('heading', { name: 'Dodaj bota lub dołącz do serwera' })).toBeInTheDocument();

  // Forward to step 2, then into discord mode
  await user.click(screen.getByRole('button', { name: /Jestem już na serwerze z botem/i }));
  await user.click(screen.getByRole('button', { name: /Zaloguj przez Discorda/i }));
  expect(screen.getByRole('button', { name: /Przejdź do Discorda/i })).toBeInTheDocument();

  // Back from discord mode to choose mode
  await user.click(screen.getByRole('button', { name: /Wstecz/i }));
  expect(screen.getByRole('heading', { name: 'Jak chcesz założyć konto' })).toBeInTheDocument();

  // Back from choose mode to step 1
  await user.click(screen.getByRole('button', { name: /Wstecz/i }));
  expect(screen.getByRole('heading', { name: 'Dodaj bota lub dołącz do serwera' })).toBeInTheDocument();
});

test('skips choose mode when Discord login is not enabled', async () => {
  vi.stubEnv('VITE_DISCORD_CLIENT_ID', '');
  const user = userEvent.setup();
  renderAppRoutes(
    <Route
      path="/welcome"
      element={
        <WelcomeOnboarding
          open
          onClose={vi.fn()}
          apkAvailable={false}
          isAuthenticated={false}
          onApkUnavailable={vi.fn()}
        />
      }
    />,
    { route: '/welcome', authenticated: false },
  );
  await user.click(screen.getByRole('button', { name: /Jestem już na serwerze z botem/i }));
  expect(screen.getByRole('heading', { name: 'Jak chcesz założyć konto' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Mam już kod/i })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Przedstaw się botowi' })).not.toBeInTheDocument();
});

test('Discord choice continue button initiates redirect', async () => {
  const redirectSpy = vi.spyOn(discordOAuth, 'redirectToDiscord').mockResolvedValue();
  const user = userEvent.setup();
  renderAppRoutes(
    <Route
      path="/welcome"
      element={
        <WelcomeOnboarding
          open
          onClose={vi.fn()}
          apkAvailable={false}
          isAuthenticated={false}
          onApkUnavailable={vi.fn()}
        />
      }
    />,
    { route: '/welcome', authenticated: false },
  );
  await user.click(screen.getByRole('button', { name: /Jestem już na serwerze z botem/i }));
  await user.click(screen.getByRole('button', { name: /Zaloguj przez Discorda/i }));

  const continueBtn = screen.getByRole('button', { name: /Przejdź do Discorda/i });
  await user.click(continueBtn);
  expect(redirectSpy).toHaveBeenCalledOnce();
});

test('Discord choice in insecure context displays HTTPS error and blocks redirect', async () => {
  vi.spyOn(discordOAuth, 'isSecureContextAvailable').mockReturnValue(false);
  const redirectSpy = vi.spyOn(discordOAuth, 'redirectToDiscord').mockResolvedValue();
  const user = userEvent.setup();
  renderAppRoutes(
    <Route
      path="/welcome"
      element={
        <WelcomeOnboarding
          open
          onClose={vi.fn()}
          apkAvailable={false}
          isAuthenticated={false}
          onApkUnavailable={vi.fn()}
        />
      }
    />,
    { route: '/welcome', authenticated: false },
  );
  await user.click(screen.getByRole('button', { name: /Jestem już na serwerze z botem/i }));
  await user.click(screen.getByRole('button', { name: /Zaloguj przez Discorda/i }));

  const continueBtn = screen.getByRole('button', { name: /Przejdź do Discorda/i });
  await user.click(continueBtn);

  const alert = screen.getByRole('alert');
  expect(alert).toHaveTextContent(/wymaga połączenia HTTPS/i);
  expect(redirectSpy).not.toHaveBeenCalled();

  const tryCodeBtn = screen.getByRole('button', { name: /Zaloguj kodem z panelu/i });
  expect(tryCodeBtn).toBeInTheDocument();
  await user.click(tryCodeBtn);

  expect(screen.getByRole('heading', { name: 'Jak chcesz założyć konto' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Mam już kod/i })).toBeInTheDocument();
});

test('back button returns from discord mode to choose mode', async () => {
  const user = userEvent.setup();
  renderAppRoutes(
    <Route
      path="/welcome"
      element={
        <WelcomeOnboarding
          open
          onClose={vi.fn()}
          apkAvailable={false}
          isAuthenticated={false}
          onApkUnavailable={vi.fn()}
        />
      }
    />,
    { route: '/welcome', authenticated: false },
  );
  await user.click(screen.getByRole('button', { name: /Jestem już na serwerze z botem/i }));
  await user.click(screen.getByRole('button', { name: /Zaloguj przez Discorda/i }));
  expect(screen.getByRole('button', { name: /Przejdź do Discorda/i })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /Wstecz/i }));
  expect(screen.getByRole('heading', { name: 'Jak chcesz założyć konto' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Mam już kod/i })).toBeInTheDocument();
});
