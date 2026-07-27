import { describe, it, expect } from 'vitest';
import { sessionsLabel } from './pluralize';

describe('sessionsLabel', () => {
  it('picks the right Polish form at every boundary', () => {
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
