import { test, expect } from 'vitest';
import { formatBotStatus } from './bot';

test('formatBotStatus maps known statuses to Polish labels', () => {
  expect(formatBotStatus('online')).toBe('ONLINE');
  expect(formatBotStatus('offline')).toBe('OFFLINE');
  expect(formatBotStatus('unknown')).toBe('NIEZNANY');
});

test('formatBotStatus uppercases unknown values', () => {
  expect(formatBotStatus('degraded')).toBe('DEGRADED');
});