import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { DiscordLoginButton } from './DiscordLoginButton';
import { renderWithProviders } from '../../../test/utils';
import * as discordOAuth from '../../lib/discordOAuth';
import i18n from '../../i18n';

beforeEach(() => vi.restoreAllMocks());
afterEach(() => vi.unstubAllEnvs());

test('opens the confirm first and redirects only when continuing', async () => {
  const redirect = vi.spyOn(discordOAuth, 'redirectToDiscord').mockResolvedValue();
  renderWithProviders(<DiscordLoginButton onError={vi.fn()} />);

  await userEvent.click(screen.getByRole('button', { name: /discord/i }));

  expect(redirect).not.toHaveBeenCalled();

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('auth:botContact.continue') }),
  );

  expect(redirect).toHaveBeenCalledOnce();
});

test('renders nothing when no client id is configured', () => {
  vi.stubEnv('VITE_DISCORD_CLIENT_ID', '');
  renderWithProviders(<DiscordLoginButton onError={vi.fn()} />);

  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

test('explains the HTTPS requirement instead of starting an impossible flow', async () => {
  // crypto.subtle is absent on plain HTTP outside localhost.
  vi.spyOn(discordOAuth, 'isSecureContextAvailable').mockReturnValue(false);
  const redirect = vi.spyOn(discordOAuth, 'redirectToDiscord').mockResolvedValue();
  const onError = vi.fn();
  renderWithProviders(<DiscordLoginButton onError={onError} />);

  await userEvent.click(screen.getByRole('button', { name: /discord/i }));

  expect(redirect).not.toHaveBeenCalled();
  expect(onError).toHaveBeenCalledWith(expect.stringMatching(/HTTPS/));
  expect(
    screen.queryByRole('heading', { name: i18n.t('auth:botContact.title') }),
  ).not.toBeInTheDocument();
});

test('allows closing the confirm without redirecting', async () => {
  const redirect = vi.spyOn(discordOAuth, 'redirectToDiscord').mockResolvedValue();
  renderWithProviders(<DiscordLoginButton onError={vi.fn()} />);

  await userEvent.click(screen.getByRole('button', { name: /discord/i }));
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('auth:botContact.back') }),
  );

  expect(redirect).not.toHaveBeenCalled();
  expect(
    screen.queryByRole('heading', { name: i18n.t('auth:botContact.title') }),
  ).not.toBeInTheDocument();
});

test('surfaces a failure to build the authorize url inside the confirm', async () => {
  vi.spyOn(discordOAuth, 'redirectToDiscord').mockRejectedValue(new Error('boom'));
  const onError = vi.fn();
  renderWithProviders(<DiscordLoginButton onError={onError} />);

  await userEvent.click(screen.getByRole('button', { name: /discord/i }));
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('auth:botContact.continue') }),
  );

  expect(onError).not.toHaveBeenCalled();
  expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('auth:errors.loginFailed'));
});
