import { AxiosError, AxiosHeaders } from 'axios';
import { test, expect } from 'vitest';
import { parseConflict } from './conflict';
import { fixtures } from '../../test/fixtures';

test('parseConflict returns conflict body on 409', () => {
  const error = new AxiosError('Conflict', '409', undefined, undefined, {
    status: 409,
    statusText: 'Conflict',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { detail: fixtures.conflictResponse },
  });

  expect(parseConflict(error)).toEqual(fixtures.conflictResponse);
});

test('parseConflict returns null for non-409 errors', () => {
  const error = new AxiosError('Server error', '500', undefined, undefined, {
    status: 500,
    statusText: 'Error',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { detail: 'fail' },
  });

  expect(parseConflict(error)).toBeNull();
});

test('parseConflict returns null for non-axios errors', () => {
  expect(parseConflict(new Error('nope'))).toBeNull();
});