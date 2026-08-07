import axios from 'axios';
import { daysUntil } from './format';
import type { DeletionStatus, PendingDeletion } from '../types/api';

/**
 * Mirrors the backend setting `account_deletion_grace_days` (default 7), which
 * is not exposed over the API — there is no deletion-status GET, and nothing is
 * scheduled yet at the moment the confirm dialog needs this number. The
 * authoritative date arrives in `purge_at` on the 202 response.
 */
export const ACCOUNT_DELETION_GRACE_DAYS = 7;

const STORAGE_KEY = 'gt.deletionScheduled';
const CONSUMED_KEY = 'gt.deletionScheduled.consumed';

/**
 * In-memory mirror of the one-shot flag below. sessionStorage is the durable
 * copy (it has to survive a refresh); this keeps the flag working when storage
 * is disabled, which is the case where getting it wrong signs a user out of a
 * session they just started.
 */
let consumedInMemory = false;

/**
 * Records that the stored status has already driven an auth teardown. The entry
 * outlives the tab's first visit to the scheduled screen, so without this a
 * later mount — pressing Back after logging in again to cancel — would tear
 * down the freshly issued token.
 */
export function markScheduledDeletionConsumed(): void {
  consumedInMemory = true;
  try {
    sessionStorage.setItem(CONSUMED_KEY, '1');
  } catch {
    // Storage disabled — the in-memory flag covers this tab's lifetime.
  }
}

export function isScheduledDeletionConsumed(): boolean {
  if (consumedInMemory) return true;
  try {
    return sessionStorage.getItem(CONSUMED_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Days remaining recomputed from the authoritative purge date. `days_left` is a
 * snapshot taken when the payload was issued, and it is persisted (login
 * response) or held in sessionStorage, so it can be read back days later. Ceil
 * matches the backend's own rounding; the stored value is the fallback for an
 * unparseable date.
 */
export function daysLeftUntil(purgeAt: string, fallback: number): number {
  const days = daysUntil(purgeAt);
  if (Number.isNaN(days)) return fallback;
  // Floor of 1, matching the backend's own `max(1, ceil(...))`: it never
  // reports 0 days while the account still exists, and neither should this.
  return Math.max(1, days);
}

export const isDeletionStatus = (value: unknown): value is DeletionStatus =>
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
  consumedInMemory = false;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(CONSUMED_KEY);
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
