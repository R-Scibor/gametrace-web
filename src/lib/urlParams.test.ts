import { describe, it, expect } from 'vitest';
import { parseIntParam, parseIntParamOrNull } from './urlParams';

describe('parseIntParam', () => {
  it('falls back when the param is missing', () => {
    expect(parseIntParam(new URLSearchParams(''), 'skip', 0)).toBe(0);
  });

  it('falls back when the param is not a number', () => {
    expect(parseIntParam(new URLSearchParams('skip=abc'), 'skip', 0)).toBe(0);
  });

  it('falls back when the param is not an integer', () => {
    expect(parseIntParam(new URLSearchParams('skip=1.5'), 'skip', 0)).toBe(0);
  });

  it('parses a valid integer', () => {
    expect(parseIntParam(new URLSearchParams('skip=50'), 'skip', 0)).toBe(50);
  });
});

describe('parseIntParamOrNull', () => {
  it('returns null when the param is missing', () => {
    expect(parseIntParamOrNull(new URLSearchParams(''), 'game')).toBeNull();
  });

  it('returns null when the param is not a number', () => {
    expect(parseIntParamOrNull(new URLSearchParams('game=abc'), 'game')).toBeNull();
  });

  it('parses a valid integer', () => {
    expect(parseIntParamOrNull(new URLSearchParams('game=45'), 'game')).toBe(45);
  });
});
