import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { test, expect, beforeEach, vi } from 'vitest';
import { WelcomeOnboarding } from './WelcomeOnboarding';
import * as copyToClipboard from '../../lib/copyToClipboard';
import { renderAppRoutes, resetStores } from '../../../test/utils';

beforeEach(() => {
  resetStores();
  vi.stubGlobal('open', vi.fn());
});

test('WelcomeOnboarding step 1 opens bot invite and advances', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();

  renderAppRoutes(<Route path="/welcome" element={<WelcomeOnboarding open onClose={onClose} apkAvailable={false} isAuthenticated={false} onApkUnavailable={vi.fn()} />} />, {
    route: '/welcome',
    authenticated: false,
  });

  const joinServerBtn = screen.getByRole('button', { name: /Dołącz do serwera z botem/i });
  const addBotBtn = screen.getByRole('button', { name: /Dodaj bota do serwera/i });
  const nextBtn = screen.getByRole('button', { name: /Mam już bota/i });
  expect(joinServerBtn.className).toMatch(/stepBtnOrange/);
  expect(addBotBtn.className).toMatch(/stepBtnOrange/);
  expect(nextBtn.className).toMatch(/stepBtnNeutral/);

  await user.click(addBotBtn);
  expect(window.open).toHaveBeenCalledWith(
    expect.stringContaining('discord.com/oauth2'),
    '_blank',
    'noopener,noreferrer',
  );
  expect(addBotBtn.className).toMatch(/stepBtnNeutral/);
  expect(joinServerBtn.className).toMatch(/stepBtnNeutral/);
  expect(nextBtn.className).toMatch(/stepBtnOrange/);

  await user.click(nextBtn);
  expect(screen.getByRole('heading', { name: 'Przedstaw się botowi' })).toBeInTheDocument();
});

test('WelcomeOnboarding step 1 opens public server join invite', async () => {
  const user = userEvent.setup();

  renderAppRoutes(<Route path="/welcome" element={<WelcomeOnboarding open onClose={vi.fn()} apkAvailable={false} isAuthenticated={false} onApkUnavailable={vi.fn()} />} />, {
    route: '/welcome',
    authenticated: false,
  });

  const joinServerBtn = screen.getByRole('button', { name: /Dołącz do serwera z botem/i });
  const nextBtn = screen.getByRole('button', { name: /Mam już bota/i });

  await user.click(joinServerBtn);
  expect(window.open).toHaveBeenCalledWith(
    'https://discord.gg/tnt5wmuX34',
    '_blank',
    'noopener,noreferrer',
  );
  expect(screen.getByText(/po dołączeniu do serwera wróć tutaj/i)).toBeInTheDocument();
  expect(nextBtn.className).toMatch(/stepBtnOrange/);
});

test('WelcomeOnboarding shows bot hint after invite and supports back navigation', async () => {
  const user = userEvent.setup();

  renderAppRoutes(<Route path="/welcome" element={<WelcomeOnboarding open onClose={vi.fn()} apkAvailable={false} isAuthenticated={false} onApkUnavailable={vi.fn()} />} />, {
    route: '/welcome',
    authenticated: false,
  });

  expect(screen.queryByText(/po dodaniu bota do swojego serwera/i)).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Dodaj bota do serwera/i }));
  expect(screen.getByText(/po dodaniu bota do swojego serwera/i)).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /Mam już bota/i }));
  await user.click(screen.getByRole('button', { name: /Wstecz/i }));
  expect(screen.getByRole('heading', { name: 'Zaproś bota albo dołącz na serwer' })).toBeInTheDocument();
  expect(screen.getByText(/po dodaniu bota do swojego serwera/i)).toBeInTheDocument();
});

test('WelcomeOnboarding selects /login command field on click', async () => {
  const user = userEvent.setup();
  const copySpy = vi.spyOn(copyToClipboard, 'copyFromInput').mockResolvedValue(true);

  renderAppRoutes(<Route path="/welcome" element={<WelcomeOnboarding open onClose={vi.fn()} apkAvailable={false} isAuthenticated={false} onApkUnavailable={vi.fn()} />} />, {
    route: '/welcome',
    authenticated: false,
  });

  await user.click(screen.getByRole('button', { name: /Mam już bota/i }));
  const commandField = screen.getByLabelText('Komenda /login');
  expect(commandField).toHaveValue('/login');

  await user.click(commandField);
  expect(copySpy).toHaveBeenCalled();
  expect(screen.getByText(/skopiowano/i)).toBeInTheDocument();
  copySpy.mockRestore();
});

test('WelcomeOnboarding step 2 advances to client picker', async () => {
  const user = userEvent.setup();

  renderAppRoutes(<Route path="/welcome" element={<WelcomeOnboarding open onClose={vi.fn()} apkAvailable={true} isAuthenticated={false} onApkUnavailable={vi.fn()} />} />, {
    route: '/welcome',
    authenticated: false,
  });

  await user.click(screen.getByRole('button', { name: /Mam już bota/i }));
  await user.click(screen.getByRole('button', { name: /Mam już kod/i }));

  expect(screen.getByRole('heading', { name: 'Wybierz klienta' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Zaloguj w przeglądarce/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Pobierz apk/i })).toBeInTheDocument();
});

test('WelcomeOnboarding browser client navigates to login', async () => {
  const user = userEvent.setup();

  renderAppRoutes(
    <>
      <Route
        path="/welcome"
        element={<WelcomeOnboarding open onClose={vi.fn()} apkAvailable={false} isAuthenticated={false} onApkUnavailable={vi.fn()} />}
      />
      <Route path="/login" element={<div>Login Screen</div>} />
    </>,
    { route: '/welcome', authenticated: false },
  );

  await user.click(screen.getByRole('button', { name: /Mam już bota/i }));
  await user.click(screen.getByRole('button', { name: /Mam już kod/i }));
  await user.click(screen.getByRole('button', { name: /Zaloguj w przeglądarce/i }));

  expect(screen.getByText('Login Screen')).toBeInTheDocument();
});