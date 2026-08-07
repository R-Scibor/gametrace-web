import axios from 'axios';
import type { DeletionStatus, PendingDeletion } from '../types/api';

/**
 * Mirrors the backend setting `account_deletion_grace_days` (default 7), which
 * is not exposed over the API — there is no deletion-status GET, and nothing is
 * scheduled yet at the moment the confirm dialog needs this number. The
 * authoritative date arrives in `purge_at` on the 202 response.
 */
export const ACCOUNT_DELETION_GRACE_DAYS = 7;

const STORAGE_KEY = 'gt.deletionScheduled';

const isDeletionStatus = (value: unknown): value is DeletionStatus =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as DeletionStatus).purge_at === 'string' &&
  typeof (value as DeletionStatus).deletion_requested_at === 'string' &&
  typeof (value as DeletionStatus).days_left === 'number';

/**
 * The 202 payload is the only copy of the purge date the user will see, and
 * scheduling tears down auth immediately. Router state alone would not survive a
 * refresh, which would drop the user on /delete-account having lost the date —
 * the same failure that ruled out a toast. sessionStorage, not the persisted
 * auth blob: this is a one-shot handoff, not durable auth state.
 */
export function saveScheduledDeletion(status: DeletionStatus): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(status));
  } catch {
    // Storage disabled/full — the navigation state still carries the status.
  }
}

export function readScheduledDeletion(): DeletionStatus | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isDeletionStatus(parsed)) return null;
    return parsed;
  } catch {
    clearScheduledDeletion();
    return null;
  }
}

export function clearScheduledDeletion(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Recognises the backend's grace-period 403. The body is FastAPI-shaped and
 * double-nested: `{detail: {detail: "Account scheduled for deletion", ...}}`.
 * Every other 403 in the API (admin routes, editing an ONGOING session) carries
 * a plain string `detail`, so the object check is what keeps them out.
 */
export function pendingDeletionFromError(err: unknown): PendingDeletion | null {
  if (!axios.isAxiosError(err)) return null;
  if (err.response?.status !== 403) return null;

  const detail = (err.response.data as { detail?: unknown } | undefined)?.detail;
  if (typeof detail !== 'object' || detail === null) return null;
  if ((detail as { detail?: unknown }).detail !== 'Account scheduled for deletion') return null;
  if (!isDeletionStatus(detail)) return null;

  const { deletion_requested_at, purge_at, days_left } = detail;
  return { deletion_requested_at, purge_at, days_left };
}
