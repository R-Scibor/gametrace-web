import { beforeEach, expect, test } from 'vitest';
import i18n from '../i18n';
import {
  buildMonthMatrix,
  daysInMonth,
  formatLocalValue,
  parseLocalValue,
  shiftDay,
  toLocalValue,
} from './dateTime';

beforeEach(async () => {
  await i18n.changeLanguage('pl');
});

test('parses and formats the datetime-local string round trip', () => {
  const p = parseLocalValue('2026-11-17T20:54');
  expect(p).toEqual({ year: 2026, month: 10, day: 17, hours: 20, minutes: 54 });
  expect(toLocalValue(p!)).toBe('2026-11-17T20:54');
});

test('rejects empty and impossible values', () => {
  expect(parseLocalValue('')).toBeNull();
  expect(parseLocalValue('2026-02-30T10:00')).toBeNull();
  expect(parseLocalValue('2026-13-01T10:00')).toBeNull();
  expect(parseLocalValue('2026-11-17T24:00')).toBeNull();
});

test('month matrix starts on Monday and pads to full weeks', () => {
  // 1 November 2026 is a Sunday.
  const rows = buildMonthMatrix(2026, 10);
  expect(rows[0]).toEqual([null, null, null, null, null, null, 1]);
  expect(rows.every((r) => r.length === 7)).toBe(true);
  expect(rows.flat().filter((d) => d !== null)).toHaveLength(30);
});

test('daysInMonth handles leap years', () => {
  expect(daysInMonth(2028, 1)).toBe(29);
  expect(daysInMonth(2026, 1)).toBe(28);
});

test('shiftDay crosses month and year edges', () => {
  expect(shiftDay(2026, 11, 31, 1)).toEqual({ year: 2027, month: 0, day: 1 });
  expect(shiftDay(2026, 2, 1, -1)).toEqual({ year: 2026, month: 1, day: 28 });
});

test('formats in the app language with a 24 hour clock', async () => {
  expect(formatLocalValue('2026-11-17T20:54')).toMatch(/17 lis 2026.*20:54/);
  await i18n.changeLanguage('en');
  expect(formatLocalValue('2026-11-17T08:05')).toMatch(/17 Nov 2026.*08:05/);
  expect(formatLocalValue('')).toBeNull();
});
