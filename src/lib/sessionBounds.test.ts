import { AxiosError, AxiosHeaders } from 'axios';
import { test, expect } from 'vitest';
import {
  legalCreateRange,
  parseSessionBound,
  validateManualSessionBounds,
} from './sessionBounds';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const now = new Date('2026-06-15T12:00:00.000Z');

function bounds(start: Date, end: Date, isCreate: boolean) {
  return validateManualSessionBounds({ start, end, now, isCreate });
}

test('end equal to start is endBeforeStart and one minute later passes', () => {
  expect(bounds(now, now, true)).toBe('endBeforeStart');
  expect(bounds(new Date('invalid'), now, true)).toBe('endBeforeStart');
  expect(bounds(now, new Date('invalid'), true)).toBe('endBeforeStart');
  expect(bounds(new Date(now.getTime() - 60_000), now, true)).toBeNull();
});

test('duration allows exactly 48 hours and rejects one millisecond more', () => {
  const start = new Date(now.getTime() - 48 * HOUR);
  expect(bounds(start, now, false)).toBeNull();
  expect(bounds(new Date(start.getTime() - 1), now, false)).toBe('duration');
});

test('create lookback allows exactly 30 days and rejects one millisecond more', () => {
  const start = new Date(now.getTime() - 30 * DAY);
  const end = new Date(start.getTime() + HOUR);
  expect(bounds(start, end, true)).toBeNull();
  expect(bounds(new Date(start.getTime() - 1), new Date(end.getTime() - 1), true)).toBe('lookback');
});

test('future grace allows exactly five minutes and rejects one millisecond more', () => {
  const edge = new Date(now.getTime() + 5 * 60_000);
  expect(bounds(now, edge, true)).toBeNull();
  expect(bounds(now, new Date(edge.getTime() + 1), true)).toBe('futureEnd');
  expect(bounds(edge, new Date(edge.getTime() + 60_000), true)).toBe('futureEnd');
  expect(bounds(new Date(edge.getTime() + 1), new Date(edge.getTime() + 60_000), true)).toBe('futureStart');
});

test('edit skips lookback and future start', () => {
  const start = new Date(now.getTime() - 40 * DAY);
  const end = new Date(start.getTime() + HOUR);
  expect(bounds(start, end, false)).toBeNull();
  const ahead = new Date(now.getTime() + 10 * 60_000);
  expect(bounds(ahead, new Date(ahead.getTime() + HOUR), false)).toBe('futureEnd');
});

test('a create that is too old and too long returns lookback first', () => {
  const start = new Date(now.getTime() - 40 * DAY);
  const end = new Date(start.getTime() + 49 * HOUR);
  expect(bounds(start, end, true)).toBe('lookback');
});

function axios422(detail: unknown) {
  return new AxiosError('Unprocessable', '422', undefined, undefined, {
    status: 422,
    statusText: 'Unprocessable',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { detail },
  });
}

test('parseSessionBound maps the five frozen strings and ignores lists', () => {
  expect(parseSessionBound(axios422('end_time must be after start_time'))).toBe('endBeforeStart');
  expect(parseSessionBound(axios422('start_time is older than 30 days'))).toBe('lookback');
  expect(parseSessionBound(axios422('session duration exceeds 48 hours'))).toBe('duration');
  expect(parseSessionBound(axios422('start_time cannot be in the future'))).toBe('futureStart');
  expect(parseSessionBound(axios422('end_time cannot be in the future'))).toBe('futureEnd');
  expect(parseSessionBound(axios422([{
    type: 'value_error',
    loc: ['body', 'start_time'],
    msg: 'Value error, datetime must include a timezone offset',
  }]))).toBeNull();
  expect(parseSessionBound(axios422('nope'))).toBeNull();
  expect(parseSessionBound(new Error('nope'))).toBeNull();
});

test('legalCreateRange widens to two hours when one hour formats to the same local string', () => {
  const folded = new Date('2026-10-25T01:30:00.000Z');
  const alias = (iso: string) => (iso === folded.toISOString() || iso === new Date(folded.getTime() - HOUR).toISOString())
    ? '2026-10-25T02:30'
    : iso.slice(0, 16);
  const range = legalCreateRange(folded, alias);
  expect(range.start).toBe(new Date(folded.getTime() - 2 * HOUR).toISOString().slice(0, 16));
  expect(range.end).toBe('2026-10-25T02:30');
});

test('legalCreateRange keeps a one hour gap when the local strings differ', () => {
  const format = (iso: string) => iso.slice(0, 16);
  const range = legalCreateRange(now, format);
  expect(range.start).toBe(new Date(now.getTime() - HOUR).toISOString().slice(0, 16));
  expect(range.end).toBe(now.toISOString().slice(0, 16));
});
