import { afterEach, expect, test, vi } from 'vitest';
import {
  markReminderShown,
  reminderAlreadyShown,
  shouldShowBotReminder,
  snoozeUntilIso,
} from './botReminder';

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

const base = {
  botCanSeeUser: false as const,
  enabled: true,
  snoozedUntil: null,
  discordId: '123',
  timeZone: 'Europe/Warsaw',
};

test('shows only a confirmed invisible user with reminders on and no snooze', () => {
  expect(shouldShowBotReminder(base)).toBe(true);
  expect(shouldShowBotReminder({ ...base, botCanSeeUser: null })).toBe(false);
  expect(shouldShowBotReminder({ ...base, botCanSeeUser: true })).toBe(false);
  expect(shouldShowBotReminder({ ...base, enabled: false })).toBe(false);
});

test('hides a future snooze and shows a past one', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-22T12:00:00Z'));
  expect(
    shouldShowBotReminder({ ...base, snoozedUntil: '2026-10-23T00:00:00+00:00' }),
  ).toBe(false);
  expect(
    shouldShowBotReminder({ ...base, snoozedUntil: '2026-10-21T00:00:00+00:00' }),
  ).toBe(true);
});

test('a shown reminder stays hidden for the rest of that timezone day', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-22T12:00:00Z'));
  expect(shouldShowBotReminder(base)).toBe(true);
  markReminderShown('123', 'Europe/Warsaw');
  expect(reminderAlreadyShown('123', 'Europe/Warsaw')).toBe(true);
  expect(shouldShowBotReminder(base)).toBe(false);
});

test('snoozeUntilIso is seven days ahead and carries an explicit offset', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-22T12:00:00Z'));
  expect(snoozeUntilIso()).toBe('2026-10-29T12:00:00.000+00:00');
});
