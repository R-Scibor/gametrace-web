import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import i18n from '../i18n';
import {
  ACCOUNT_DELETION_GRACE_DAYS,
  daysLeftUntil,
  isScheduledDeletionConsumed,
  markScheduledDeletionConsumed,
  isDeletionStatus,
  saveScheduledDeletion,
  readScheduledDeletion,
  clearScheduledDeletion,
  pendingDeletionFromError,
} from './accountDeletion';
import { fixtures } from '../../test/fixtures';

function axiosErrorWithBody(httpStatus: number, data: unknown) {
  const err = new AxiosError('failed');
  err.response = {
    status: httpStatus,
    data,
    statusText: '',
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
  return err;
}

beforeEach(() => {
  // Clears both sessionStorage keys and the in-memory mirror.
  clearScheduledDeletion();
});

describe('grace constant', () => {
  it('drives the interpolated copy actually shown to the user', async () => {
    await i18n.changeLanguage('pl');
    const consequences = i18n.t('account:dialog.consequences', {
      returnObjects: true,
      days: ACCOUNT_DELETION_GRACE_DAYS,
    }) as string[];
    expect(consequences[1]).toContain(`${ACCOUNT_DELETION_GRACE_DAYS} dniach`);
  });
});

describe('isDeletionStatus', () => {
  it('accepts a well-shaped status', () => {
    expect(isDeletionStatus(fixtures.pendingDeletion)).toBe(true);
  });

  it('rejects unrelated router state', () => {
    expect(isDeletionStatus({ from: '/settings' })).toBe(false);
    expect(isDeletionStatus(null)).toBe(false);
    expect(isDeletionStatus('nope')).toBe(false);
  });
});

describe('scheduled-deletion session storage', () => {
  it('round-trips a status', () => {
    saveScheduledDeletion(fixtures.pendingDeletion);
    expect(readScheduledDeletion()).toEqual(fixtures.pendingDeletion);
  });

  it('returns null when nothing is stored', () => {
    expect(readScheduledDeletion()).toBeNull();
  });

  it('returns null and self-heals on corrupt JSON', () => {
    sessionStorage.setItem('gt.deletionScheduled', '{not json');
    expect(readScheduledDeletion()).toBeNull();
    expect(sessionStorage.getItem('gt.deletionScheduled')).toBeNull();
  });

  it('returns null when the stored object is the wrong shape', () => {
    sessionStorage.setItem('gt.deletionScheduled', JSON.stringify({ nope: true }));
    expect(readScheduledDeletion()).toBeNull();
  });

  it('clears', () => {
    saveScheduledDeletion(fixtures.pendingDeletion);
    clearScheduledDeletion();
    expect(readScheduledDeletion()).toBeNull();
  });
});

describe('pendingDeletionFromError', () => {
  it('extracts the nested pending-deletion body from a 403', () => {
    const err = axiosErrorWithBody(403, { detail: { detail: 'Account scheduled for deletion', ...fixtures.pendingDeletion } });
    expect(pendingDeletionFromError(err)).toEqual(fixtures.pendingDeletion);
  });

  it('ignores a 403 with a plain string detail (admin route, ONGOING session)', () => {
    expect(pendingDeletionFromError(axiosErrorWithBody(403, { detail: 'Admin access required' }))).toBeNull();
  });

  it('ignores a non-403', () => {
    const err = axiosErrorWithBody(401, { detail: { detail: 'Account scheduled for deletion', ...fixtures.pendingDeletion } });
    expect(pendingDeletionFromError(err)).toBeNull();
  });

  it('ignores a non-axios error', () => {
    expect(pendingDeletionFromError(new Error('nope'))).toBeNull();
  });
});

describe('daysLeftUntil', () => {
  // Date only: RTL and TanStack elsewhere in the suite need real timers.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
  });

  it('recomputes from the purge date rather than trusting a stale snapshot', () => {
    vi.setSystemTime(new Date('2026-08-12T12:00:00Z'));
    // days_left: 7 was true when the payload was issued five days ago.
    expect(daysLeftUntil('2026-08-14T12:00:00Z', 7)).toBe(2);
  });

  it('rounds up a partial day, matching the backend', () => {
    vi.setSystemTime(new Date('2026-08-13T23:00:00Z'));
    expect(daysLeftUntil('2026-08-14T12:00:00Z', 7)).toBe(1);
  });

  it('never reports zero once the purge date has passed, matching the backend', () => {
    // The backend's days_left is max(1, ceil(...)): it never reads 0 while the
    // account still exists, and the row can outlive purge_at by up to a day
    // because the purge sweep runs nightly. Reporting 0 here would tell a user
    // their data is already gone while it demonstrably is not.
    vi.setSystemTime(new Date('2026-08-20T12:00:00Z'));
    expect(daysLeftUntil('2026-08-14T12:00:00Z', 7)).toBe(1);
  });

  it('falls back to the stored count when the date is unparseable', () => {
    expect(daysLeftUntil('not-a-date', 4)).toBe(4);
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});

describe('scheduled-deletion consumed flag', () => {
  it('survives a reload via sessionStorage', () => {
    expect(isScheduledDeletionConsumed()).toBe(false);
    markScheduledDeletionConsumed();
    expect(sessionStorage.getItem('gt.deletionScheduled.consumed')).toBe('1');
    expect(isScheduledDeletionConsumed()).toBe(true);
  });

  it('is cleared along with the stored status', () => {
    markScheduledDeletionConsumed();
    clearScheduledDeletion();
    expect(isScheduledDeletionConsumed()).toBe(false);
  });
});
