import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { BotContactConfirm } from './BotContactConfirm';
import { renderWithProviders, resetStores } from '../../../test/utils';
import i18n from '../../i18n';

beforeEach(() => {
  resetStores();
  vi.stubGlobal('open', vi.fn());
});

test('continue calls onContinue and the links open the configured invites', async () => {
  const user = userEvent.setup();
  const onContinue = vi.fn();
  const onClose = vi.fn();
  renderWithProviders(
    <BotContactConfirm open onClose={onClose} onContinue={onContinue} />,
  );

  expect(screen.getByRole('heading', { name: i18n.t('auth:botContact.title') })).toBeInTheDocument();
  expect(screen.getByText(i18n.t('auth:botContact.permission'))).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: i18n.t('auth:botContact.join') }));
  expect(window.open).toHaveBeenCalledWith(
    'https://discord.gg/test-invite',
    '_blank',
    'noopener,noreferrer',
  );
  expect(onContinue).not.toHaveBeenCalled();

  await user.click(screen.getByRole('button', { name: i18n.t('auth:botContact.continue') }));
  expect(onContinue).toHaveBeenCalledOnce();
});

test('back closes without continuing', async () => {
  const user = userEvent.setup();
  const onContinue = vi.fn();
  const onClose = vi.fn();
  renderWithProviders(
    <BotContactConfirm open onClose={onClose} onContinue={onContinue} />,
  );
  await user.click(screen.getByRole('button', { name: i18n.t('auth:botContact.back') }));
  expect(onClose).toHaveBeenCalled();
  expect(onContinue).not.toHaveBeenCalled();
});

test('shows an error inside the dialog when continue throws', async () => {
  const user = userEvent.setup();
  renderWithProviders(
    <BotContactConfirm
      open
      onClose={vi.fn()}
      onContinue={() => {
        throw new Error('boom');
      }}
    />,
  );
  await user.click(screen.getByRole('button', { name: i18n.t('auth:botContact.continue') }));
  expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('auth:errors.loginFailed'));
});

test('clears error and pending state when dialog closes and reopens', async () => {
  const user = userEvent.setup();
  const { rerender } = renderWithProviders(
    <BotContactConfirm
      open
      onClose={vi.fn()}
      onContinue={() => {
        throw new Error('boom');
      }}
    />,
  );
  await user.click(screen.getByRole('button', { name: i18n.t('auth:botContact.continue') }));
  expect(screen.getByRole('alert')).toBeInTheDocument();

  rerender(
    <BotContactConfirm
      open={false}
      onClose={vi.fn()}
      onContinue={vi.fn()}
    />,
  );
  rerender(
    <BotContactConfirm
      open
      onClose={vi.fn()}
      onContinue={vi.fn()}
    />,
  );
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('insecure context displays HTTPS error and does not call onContinue', async () => {
  const user = userEvent.setup();
  const onContinue = vi.fn();
  const discordOAuth = await import('../../lib/discordOAuth');
  vi.spyOn(discordOAuth, 'isSecureContextAvailable').mockReturnValue(false);

  renderWithProviders(
    <BotContactConfirm
      open
      onClose={vi.fn()}
      onContinue={onContinue}
    />,
  );
  await user.click(screen.getByRole('button', { name: i18n.t('auth:botContact.continue') }));
  expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('auth:errors.discordInsecure'));
  expect(onContinue).not.toHaveBeenCalled();
});

