import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { BotVisibilityReminder } from './BotVisibilityReminder';
import { renderWithProviders, resetStores } from '../../../test/utils';
import { server } from '../../../test/server';
import { fixtures } from '../../../test/fixtures';
import { markReminderShown, snoozeUntilIso } from '../../lib/botReminder';
import { qk } from '../../lib/queryKeys';
import { useToastStore } from '../../store/toastStore';

beforeEach(() => {
  resetStores();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test('heading "Bot cię nie widzi" appears when bot_can_see_user is false, reminders enabled, not snoozed, and not shown today', async () => {
  server.use(
    http.get('/api/v1/profile/me', () =>
      HttpResponse.json({
        ...fixtures.profileMe,
        bot_can_see_user: false,
        bot_visibility_reminders_enabled: true,
        bot_visibility_reminder_snoozed_until: null,
      }),
    ),
  );

  renderWithProviders(<BotVisibilityReminder />, { authenticated: true });
  expect(await screen.findByRole('heading', { name: /bot cię nie widzi/i })).toBeInTheDocument();
});

test('when markReminderShown is called before render, the heading is absent', async () => {
  server.use(
    http.get('/api/v1/profile/me', () =>
      HttpResponse.json({
        ...fixtures.profileMe,
        discord_id: '123',
        timezone: 'Europe/Warsaw',
        bot_can_see_user: false,
        bot_visibility_reminders_enabled: true,
        bot_visibility_reminder_snoozed_until: null,
      }),
    ),
  );

  markReminderShown('123', 'Europe/Warsaw');
  const { queryClient } = renderWithProviders(<BotVisibilityReminder />, { authenticated: true });
  await waitFor(() => expect(queryClient.getQueryData(qk.profile)).toBeDefined());
  expect(screen.queryByRole('heading', { name: /bot cię nie widzi/i })).not.toBeInTheDocument();
});

test('bot_can_see_user: null does not show the heading', async () => {
  server.use(
    http.get('/api/v1/profile/me', () =>
      HttpResponse.json({
        ...fixtures.profileMe,
        bot_can_see_user: null,
        bot_visibility_reminders_enabled: true,
        bot_visibility_reminder_snoozed_until: null,
      }),
    ),
  );

  const { queryClient } = renderWithProviders(<BotVisibilityReminder />, { authenticated: true });
  await waitFor(() => expect(queryClient.getQueryData(qk.profile)).toBeDefined());
  expect(screen.queryByRole('heading', { name: /bot cię nie widzi/i })).not.toBeInTheDocument();
});

test('bot_can_see_user: true does not show the heading', async () => {
  server.use(
    http.get('/api/v1/profile/me', () =>
      HttpResponse.json({
        ...fixtures.profileMe,
        bot_can_see_user: true,
        bot_visibility_reminders_enabled: true,
        bot_visibility_reminder_snoozed_until: null,
      }),
    ),
  );

  const { queryClient } = renderWithProviders(<BotVisibilityReminder />, { authenticated: true });
  await waitFor(() => expect(queryClient.getQueryData(qk.profile)).toBeDefined());
  expect(screen.queryByRole('heading', { name: /bot cię nie widzi/i })).not.toBeInTheDocument();
});

test('bot_visibility_reminders_enabled: false does not show the heading', async () => {
  server.use(
    http.get('/api/v1/profile/me', () =>
      HttpResponse.json({
        ...fixtures.profileMe,
        bot_can_see_user: false,
        bot_visibility_reminders_enabled: false,
        bot_visibility_reminder_snoozed_until: null,
      }),
    ),
  );

  const { queryClient } = renderWithProviders(<BotVisibilityReminder />, { authenticated: true });
  await waitFor(() => expect(queryClient.getQueryData(qk.profile)).toBeDefined());
  expect(screen.queryByRole('heading', { name: /bot cię nie widzi/i })).not.toBeInTheDocument();
});

test('bot_visibility_reminder_snoozed_until tomorrow does not show the heading', async () => {
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString();
  server.use(
    http.get('/api/v1/profile/me', () =>
      HttpResponse.json({
        ...fixtures.profileMe,
        bot_can_see_user: false,
        bot_visibility_reminders_enabled: true,
        bot_visibility_reminder_snoozed_until: tomorrow,
      }),
    ),
  );

  const { queryClient } = renderWithProviders(<BotVisibilityReminder />, { authenticated: true });
  await waitFor(() => expect(queryClient.getQueryData(qk.profile)).toBeDefined());
  expect(screen.queryByRole('heading', { name: /bot cię nie widzi/i })).not.toBeInTheDocument();
});

test('click "PRZYPOMNIJ ZA 7 DNI" PUTs { bot_visibility_reminder_snoozed_until: snoozeUntilIso() } and heading goes away', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-22T12:00:00Z'));

  let capturedBody: unknown = null;
  server.use(
    http.get('/api/v1/profile/me', () =>
      HttpResponse.json({
        ...fixtures.profileMe,
        bot_can_see_user: false,
        bot_visibility_reminders_enabled: true,
        bot_visibility_reminder_snoozed_until: null,
      }),
    ),
    http.put('/api/v1/profile/settings', async ({ request }) => {
      capturedBody = await request.json();
      return HttpResponse.json({
        ...fixtures.profileMe,
        bot_visibility_reminder_snoozed_until: snoozeUntilIso(),
      });
    }),
  );

  renderWithProviders(<BotVisibilityReminder />, { authenticated: true });
  expect(await screen.findByRole('heading', { name: /bot cię nie widzi/i })).toBeInTheDocument();

  const snoozeBtn = screen.getByRole('button', { name: /przypomnij za 7 dni/i });
  await userEvent.click(snoozeBtn);

  await waitFor(() => {
    expect(screen.queryByRole('heading', { name: /bot cię nie widzi/i })).not.toBeInTheDocument();
  });

  expect(capturedBody).toEqual({
    bot_visibility_reminder_snoozed_until: snoozeUntilIso(),
  });

  const toasts = useToastStore.getState().toasts;
  expect(toasts).toHaveLength(1);
  expect(toasts[0].message).toBe('Przypomnienie wyciszone na 7 dni.');
});

test('external links for join and addBot open with _blank and noopener,noreferrer', async () => {
  const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
  server.use(
    http.get('/api/v1/profile/me', () =>
      HttpResponse.json({
        ...fixtures.profileMe,
        bot_can_see_user: false,
        bot_visibility_reminders_enabled: true,
        bot_visibility_reminder_snoozed_until: null,
      }),
    ),
  );

  renderWithProviders(<BotVisibilityReminder />, { authenticated: true });
  expect(await screen.findByRole('heading', { name: /bot cię nie widzi/i })).toBeInTheDocument();

  const joinBtn = screen.getByRole('button', { name: /dołącz do serwera/i });
  await userEvent.click(joinBtn);
  expect(openSpy).toHaveBeenCalledWith(
    'https://discord.gg/test-invite',
    '_blank',
    'noopener,noreferrer',
  );

  const addBotBtn = screen.getByRole('button', { name: /dodaj bota do serwera/i });
  await userEvent.click(addBotBtn);
  expect(openSpy).toHaveBeenCalledWith(
    'https://discord.com/oauth2/authorize?client_id=test&permissions=2048&integration_type=0&scope=bot+applications.commands',
    '_blank',
    'noopener,noreferrer',
  );
});

test('snooze failure displays error toast and re-enables snooze button', async () => {
  server.use(
    http.get('/api/v1/profile/me', () =>
      HttpResponse.json({
        ...fixtures.profileMe,
        bot_can_see_user: false,
        bot_visibility_reminders_enabled: true,
        bot_visibility_reminder_snoozed_until: null,
      }),
    ),
    http.put('/api/v1/profile/settings', () =>
      HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 }),
    ),
  );

  renderWithProviders(<BotVisibilityReminder />, { authenticated: true });
  expect(await screen.findByRole('heading', { name: /bot cię nie widzi/i })).toBeInTheDocument();

  const snoozeBtn = screen.getByRole('button', { name: /przypomnij za 7 dni/i });
  expect(snoozeBtn).toBeEnabled();

  await userEvent.click(snoozeBtn);

  await waitFor(() => {
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].type).toBe('error');
    expect(toasts[0].message).toBe('Nie udało się zapisać ustawień.');
  });

  expect(snoozeBtn).toBeEnabled();
  expect(screen.getByRole('heading', { name: /bot cię nie widzi/i })).toBeInTheDocument();
});

test('dismissing the modal via Escape key closes dialog and does not reopen', async () => {
  server.use(
    http.get('/api/v1/profile/me', () =>
      HttpResponse.json({
        ...fixtures.profileMe,
        bot_can_see_user: false,
        bot_visibility_reminders_enabled: true,
        bot_visibility_reminder_snoozed_until: null,
      }),
    ),
  );

  renderWithProviders(<BotVisibilityReminder />, { authenticated: true });
  expect(await screen.findByRole('heading', { name: /bot cię nie widzi/i })).toBeInTheDocument();

  await userEvent.keyboard('{Escape}');

  await waitFor(() => {
    expect(screen.queryByRole('heading', { name: /bot cię nie widzi/i })).not.toBeInTheDocument();
  });
});
