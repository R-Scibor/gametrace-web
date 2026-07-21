import { describe, it, expect } from 'vitest';
import { plPlural, sessionsLabel } from './pluralize';

describe('plPlural', () => {
  it('picks "many" for 0', () => {
    expect(plPlural(0, ['sesja', 'sesje', 'sesji'])).toBe('sesji');
  });

  it('picks "one" for 1', () => {
    expect(plPlural(1, ['sesja', 'sesje', 'sesji'])).toBe('sesja');
  });

  it('picks "few" for 2', () => {
    expect(plPlural(2, ['sesja', 'sesje', 'sesji'])).toBe('sesje');
  });

  it('picks "few" for 4', () => {
    expect(plPlural(4, ['sesja', 'sesje', 'sesji'])).toBe('sesje');
  });

  it('picks "many" for 5', () => {
    expect(plPlural(5, ['sesja', 'sesje', 'sesji'])).toBe('sesji');
  });

  it('picks "many" for 12 (the 12-14 exception)', () => {
    expect(plPlural(12, ['sesja', 'sesje', 'sesji'])).toBe('sesji');
  });

  it('picks "few" for 22', () => {
    expect(plPlural(22, ['sesja', 'sesje', 'sesji'])).toBe('sesje');
  });

  it('picks "many" for 25', () => {
    expect(plPlural(25, ['sesja', 'sesje', 'sesji'])).toBe('sesji');
  });
});

describe('sessionsLabel', () => {
  it('formats the boundary cases', () => {
    expect(sessionsLabel(0)).toBe('0 sesji');
    expect(sessionsLabel(1)).toBe('1 sesja');
    expect(sessionsLabel(2)).toBe('2 sesje');
    expect(sessionsLabel(4)).toBe('4 sesje');
    expect(sessionsLabel(5)).toBe('5 sesji');
    expect(sessionsLabel(12)).toBe('12 sesji');
    expect(sessionsLabel(22)).toBe('22 sesje');
    expect(sessionsLabel(25)).toBe('25 sesji');
  });
});
