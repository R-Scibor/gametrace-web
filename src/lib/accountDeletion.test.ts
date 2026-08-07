import { describe, it, expect, beforeEach } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import {
  ACCOUNT_DELETION_GRACE_DAYS,
  saveScheduledDeletion,
  readScheduledDeletion,
  clearScheduledDeletion,
  pendingDeletionFromError,
} from './accountDeletion';

const status = {
  deletion_requested_at: '2026-08-07T12:00:00Z',
  purge_at: '2026-08-14T12:00:00Z',
  days_left: 7,
};

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
  sessionStorage.clear();
});

describe('grace constant', () => {
  it('mirrors the backend default', () => {
    expect(ACCOUNT_DELETION_GRACE_DAYS).toBe(7);
  });
});

describe('scheduled-deletion session storage', () => {
  it('round-trips a status', () => {
    saveScheduledDeletion(status);
    expect(readScheduledDeletion()).toEqual(status);
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
    saveScheduledDeletion(status);
    clearScheduledDeletion();
    expect(readScheduledDeletion()).toBeNull();
  });
});

describe('pendingDeletionFromError', () => {
  it('extracts the nested pending-deletion body from a 403', () => {
    const err = axiosErrorWithBody(403, { detail: { detail: 'Account scheduled for deletion', ...status } });
    expect(pendingDeletionFromError(err)).toEqual(status);
  });

  it('ignores a 403 with a plain string detail (admin route, ONGOING session)', () => {
    expect(pendingDeletionFromError(axiosErrorWithBody(403, { detail: 'Admin access required' }))).toBeNull();
  });

  it('ignores a non-403', () => {
    const err = axiosErrorWithBody(401, { detail: { detail: 'Account scheduled for deletion', ...status } });
    expect(pendingDeletionFromError(err)).toBeNull();
  });

  it('ignores a non-axios error', () => {
    expect(pendingDeletionFromError(new Error('nope'))).toBeNull();
  });
});
