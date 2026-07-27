import { describe, it, expect, beforeEach } from 'vitest';
import i18n from './index';

/**
 * Polish selects between three forms; English between two. These keys are read
 * with a bare `t(key, { count })`, so a missing `_few` / `_many` variant would
 * silently fall back to the base key and render the wrong grammatical form.
 */
describe('plural keys resolve every Polish form', () => {
  it('library:count', () => {
    expect(i18n.t('library:count', { count: 1 })).toBe('gra');
    expect(i18n.t('library:count', { count: 2 })).toBe('gry');
    expect(i18n.t('library:count', { count: 4 })).toBe('gry');
    expect(i18n.t('library:count', { count: 5 })).toBe('gier');
    expect(i18n.t('library:count', { count: 12 })).toBe('gier');
    expect(i18n.t('library:count', { count: 22 })).toBe('gry');
  });

  it('dashboard:errors.count', () => {
    expect(i18n.t('dashboard:errors.count', { count: 1 })).toBe('1 nieudana sesja wymaga uwagi');
    expect(i18n.t('dashboard:errors.count', { count: 3 })).toBe('3 nieudane sesje wymagają uwagi');
    expect(i18n.t('dashboard:errors.count', { count: 5 })).toBe('5 nieudanych sesji wymaga uwagi');
  });

  it('analytics:panels.gameCount', () => {
    expect(i18n.t('analytics:panels.gameCount', { count: 1 })).toBe('1 gra');
    expect(i18n.t('analytics:panels.gameCount', { count: 3 })).toBe('3 gry');
    expect(i18n.t('analytics:panels.gameCount', { count: 5 })).toBe('5 gier');
  });
});

describe('plural keys resolve both English forms', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('picks singular at one and plural elsewhere', () => {
    expect(i18n.t('library:count', { count: 1 })).toBe('game');
    expect(i18n.t('library:count', { count: 2 })).toBe('games');
    expect(i18n.t('analytics:panels.gameCount', { count: 1 })).toBe('1 game');
    expect(i18n.t('analytics:panels.gameCount', { count: 2 })).toBe('2 games');
    expect(i18n.t('dashboard:errors.count', { count: 1 })).toBe('1 failed session needs attention');
    expect(i18n.t('dashboard:errors.count', { count: 2 })).toBe(
      '2 failed sessions need attention',
    );
  });
});
