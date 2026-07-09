import { test, expect } from 'vitest';
import { parseAnalyticsDays, DEFAULT_ANALYTICS_DAYS } from './analyticsDays';

test('parseAnalyticsDays accepts valid presets', () => {
  expect(parseAnalyticsDays('7')).toBe(7);
  expect(parseAnalyticsDays('365')).toBe(365);
  expect(parseAnalyticsDays('0')).toBe(0);
});

test('parseAnalyticsDays falls back for invalid values', () => {
  expect(parseAnalyticsDays(null)).toBe(DEFAULT_ANALYTICS_DAYS);
  expect(parseAnalyticsDays('14')).toBe(DEFAULT_ANALYTICS_DAYS);
  expect(parseAnalyticsDays('')).toBe(DEFAULT_ANALYTICS_DAYS);
});