import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { test, expect, beforeEach, afterEach, vi } from 'vitest';
import { WelcomeOnboarding } from './WelcomeOnboarding';
import * as copyToClipboard from '../../lib/copyToClipboard';
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
  const nextBtn = screen.getByRole('button', { name: /Mam już bota na serwerze/i });

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
  expect(screen.getByLabelText('Komenda /login')).toBeInTheDocument();
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

  await user.click(screen.getByRole('button', { name: /Mam już bota na serwerze/i }));
  await user.click(screen.getByRole('button', { name: /Wstecz/i }));
  expect(screen.getByRole('heading', { name: 'Dodaj bota lub dołącz do serwera' })).toBeInTheDocument();
  expect(screen.getByText(/po dodaniu bota do swojego serwera/i)).toBeInTheDocument();
});

test('WelcomeOnboarding selects /login command field on click', async () => {
  const user = userEvent.setup();
  const copySpy = vi.spyOn(copyToClipboard, 'copyFromInput').mockResolvedValue(true);

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

  await user.click(screen.getByRole('button', { name: /Mam już bota na serwerze/i }));
  const commandField = screen.getByLabelText('Komenda /login');
  expect(commandField).toHaveValue('/login');

  await user.click(commandField);
  expect(copySpy).toHaveBeenCalled();
  expect(screen.getByText('SKOPIOWANO')).toBeInTheDocument();
  expect(screen.getByText(/Skopiowano — wklej na Discordzie/i)).toBeInTheDocument();
  copySpy.mockRestore();
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

  await user.click(screen.getByRole('button', { name: /Mam już bota na serwerze/i }));
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

  await user.click(screen.getByRole('button', { name: /Mam już bota na serwerze/i }));
  await user.click(screen.getByRole('button', { name: /Mam już kod/i }));
  await user.click(screen.getByRole('button', { name: /Zaloguj w przeglądarce/i }));

  expect(screen.getByText('Login Screen')).toBeInTheDocument();
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
  await user.click(screen.getByRole('button', { name: /Mam już bota na serwerze/i }));
  await user.click(screen.getByRole('button', { name: /Zaloguj przez Discorda/i }));
  expect(screen.getByRole('button', { name: /Przejdź do Discorda/i })).toBeInTheDocument();
  expect(screen.getByText(/Zaraz otworzy się Discord/i)).toBeInTheDocument();
  expect(screen.queryByLabelText('Komenda /login')).not.toBeInTheDocument();
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
  // From step 1 to step 2 (shows code / /login chip)
  await user.click(screen.getByRole('button', { name: /Mam już bota na serwerze/i }));
  expect(screen.getByRole('heading', { name: 'Jak chcesz założyć konto' })).toBeInTheDocument();
  expect(screen.getByLabelText('Komenda /login')).toBeInTheDocument();

  // Back from step 2 to step 1
  await user.click(screen.getByRole('button', { name: /Wstecz/i }));
  expect(screen.getByRole('heading', { name: 'Dodaj bota lub dołącz do serwera' })).toBeInTheDocument();

  // Forward to step 2, then into discord mode
  await user.click(screen.getByRole('button', { name: /Mam już bota na serwerze/i }));
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
  await user.click(screen.getByRole('button', { name: /Mam już bota na serwerze/i }));
  expect(screen.getByRole('heading', { name: 'Jak chcesz założyć konto' })).toBeInTheDocument();
  expect(screen.getByLabelText('Komenda /login')).toBeInTheDocument();
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
  await user.click(screen.getByRole('button', { name: /Mam już bota na serwerze/i }));
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
  await user.click(screen.getByRole('button', { name: /Mam już bota na serwerze/i }));
  await user.click(screen.getByRole('button', { name: /Zaloguj przez Discorda/i }));

  const continueBtn = screen.getByRole('button', { name: /Przejdź do Discorda/i });
  await user.click(continueBtn);

  expect(screen.getByRole('alert')).toHaveTextContent(/wymaga połączenia HTTPS/i);
  expect(redirectSpy).not.toHaveBeenCalled();
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
  await user.click(screen.getByRole('button', { name: /Mam już bota na serwerze/i }));
  await user.click(screen.getByRole('button', { name: /Zaloguj przez Discorda/i }));
  expect(screen.getByRole('button', { name: /Przejdź do Discorda/i })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /Wstecz/i }));
  expect(screen.getByRole('heading', { name: 'Jak chcesz założyć konto' })).toBeInTheDocument();
  expect(screen.getByLabelText('Komenda /login')).toBeInTheDocument();
});
