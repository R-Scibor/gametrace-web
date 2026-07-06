import { test, expect, vi, afterEach } from 'vitest';
import {
  formatDuration,
  formatHours,
  formatDate,
  formatTimeShort,
  formatDateShort,
  formatDaysUntil,
  formatRecency,
} from './format';

afterEach(() => {
  vi.useRealTimers();
});

test('formatDuration formats hours and minutes', () => {
  expect(formatDuration(0)).toBe('—');
  expect(formatDuration(null)).toBe('—');
  expect(formatDuration(45 * 60)).toBe('45m');
  expect(formatDuration(2 * 3600 + 30 * 60)).toBe('2h 30m');
});

test('formatHours converts seconds to one decimal hour', () => {
  expect(formatHours(3600)).toBe('1.0');
  expect(formatHours(5400)).toBe('1.5');
});

test('formatDate and formatTimeShort use Polish locale', () => {
  const iso = '2026-06-15T14:30:00Z';
  expect(formatDate(iso)).toMatch(/15[./]06[./]2026/);
  expect(formatTimeShort(iso)).toMatch(/\d{2}:\d{2}/);
  expect(formatDateShort(iso)).toMatch(/15/);
});

test('formatDate respects profile timezone', () => {
  const iso = '2026-06-15T22:30:00Z';
  const utc = formatTimeShort(iso, { timeZone: 'UTC' });
  const warsaw = formatTimeShort(iso, { timeZone: 'Europe/Warsaw' });
  expect(utc).not.toBe(warsaw);
});

test('formatDaysUntil returns Polish day labels', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

  expect(formatDaysUntil('2026-06-16T12:00:00Z')).toBe('1 dzień');
  expect(formatDaysUntil('2026-06-18T12:00:00Z')).toBe('3 dni');
  expect(formatDaysUntil('2026-06-15T11:00:00Z')).toBe('wkrótce');
});

test('formatRecency returns Polish relative play labels', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

  expect(formatRecency('2026-06-15T08:00:00Z')).toBe('grano dziś');
  expect(formatRecency('2026-06-14T08:00:00Z')).toBe('grano wczoraj');
  expect(formatRecency('2026-06-12T08:00:00Z')).toBe('grano 3 dni temu');
  expect(formatRecency('2026-05-20T08:00:00Z')).toMatch(/grano \d{2}/);
});