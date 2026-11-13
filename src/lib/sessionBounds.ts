import axios from 'axios';

export const SESSION_MAX_DURATION_MS = 48 * 60 * 60 * 1000;
export const SESSION_MAX_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;
export const SESSION_FUTURE_GRACE_MS = 5 * 60 * 1000;

export type SessionBoundCode =
  | 'endBeforeStart'
  | 'lookback'
  | 'duration'
  | 'futureStart'
  | 'futureEnd';

export const BOUND_DETAIL: Record<SessionBoundCode, string> = {
  endBeforeStart: 'end_time must be after start_time',
  lookback: 'start_time is older than 30 days',
  duration: 'session duration exceeds 48 hours',
  futureStart: 'start_time cannot be in the future',
  futureEnd: 'end_time cannot be in the future',
};

export function validateManualSessionBounds(input: {
  start: Date;
  end: Date;
  now?: Date;
  isCreate: boolean;
}): SessionBoundCode | null {
  const now = input.now ?? new Date();
  const start = input.start.getTime();
  const end = input.end.getTime();
  const nowMs = now.getTime();
  if (end <= start) return 'endBeforeStart';
  if (input.isCreate && start < nowMs - SESSION_MAX_LOOKBACK_MS) return 'lookback';
  if (end - start > SESSION_MAX_DURATION_MS) return 'duration';
  if (input.isCreate && start > nowMs + SESSION_FUTURE_GRACE_MS) return 'futureStart';
  if (end > nowMs + SESSION_FUTURE_GRACE_MS) return 'futureEnd';
  return null;
}

export function legalCreateRange(
  now: Date,
  formatLocal: (iso: string) => string,
): { start: string; end: string } {
  const endLocal = formatLocal(now.toISOString());
  for (const hours of [1, 2]) {
    const start = new Date(now.getTime() - hours * 60 * 60 * 1000);
    const startLocal = formatLocal(start.toISOString());
    const code = validateManualSessionBounds({
      start: new Date(startLocal),
      end: new Date(endLocal),
      now,
      isCreate: true,
    });
    if (code === null) return { start: startLocal, end: endLocal };
  }
  const start = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  return { start: formatLocal(start.toISOString()), end: endLocal };
}

export function parseSessionBound(error: unknown): SessionBoundCode | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 422) return null;
  const detail = (error.response.data as { detail?: unknown } | undefined)?.detail;
  if (typeof detail !== 'string') return null;
  const match = (Object.keys(BOUND_DETAIL) as SessionBoundCode[])
    .find((code) => BOUND_DETAIL[code] === detail);
  return match ?? null;
}
