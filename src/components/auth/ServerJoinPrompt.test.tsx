import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { ServerJoinPrompt } from './ServerJoinPrompt';
import { useServerJoinStore } from '../../store/serverJoinStore';
import { renderWithProviders, resetStores } from '../../../test/utils';

beforeEach(() => resetStores());
afterEach(() => vi.unstubAllEnvs());

test('stays hidden until a login asks for it', () => {
  renderWithProviders(<ServerJoinPrompt />);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('offers the invite and closes after opening it', async () => {
  const open = vi.spyOn(window, 'open').mockReturnValue(null);
  useServerJoinStore.getState().show();
  renderWithProviders(<ServerJoinPrompt />);

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /dołącz/i }));

  expect(open).toHaveBeenCalledWith(
    'https://discord.gg/test-invite',
    '_blank',
    'noopener,noreferrer',
  );
  expect(useServerJoinStore.getState().visible).toBe(false);
});

test('can be dismissed without joining', async () => {
  useServerJoinStore.getState().show();
  renderWithProviders(<ServerJoinPrompt />);

  await userEvent.click(screen.getByRole('button', { name: /pomiń/i }));

  expect(useServerJoinStore.getState().visible).toBe(false);
});

test('renders nothing when no invite url is configured', () => {
  vi.stubEnv('VITE_DISCORD_SERVER_INVITE_URL', '');
  useServerJoinStore.getState().show();
  renderWithProviders(<ServerJoinPrompt />);

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
