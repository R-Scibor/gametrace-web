import { test, expect } from 'vitest';
import { formatLinkCode, isCompleteLinkCode, normalizeLinkCode } from './linkCode';

test('normalizeLinkCode strips non-digits and caps at 6', () => {
  expect(normalizeLinkCode('231 996')).toBe('231996');
  expect(normalizeLinkCode('12ab34cd56ef')).toBe('123456');
});

test('formatLinkCode inserts space after third digit', () => {
  expect(formatLinkCode('231996')).toBe('231 996');
  expect(formatLinkCode('12')).toBe('12');
});

test('isCompleteLinkCode requires six digits', () => {
  expect(isCompleteLinkCode('231 996')).toBe(true);
  expect(isCompleteLinkCode('23199')).toBe(false);
});