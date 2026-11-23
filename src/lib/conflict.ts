import axios, { type AxiosError } from 'axios';
import type { ConflictResponse, Session } from '../types/api';

export const OVERLAP_DETAIL = 'Session overlaps with an existing session';
export const WRITER_DETAIL = 'Session was updated by another writer';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasRenderableSession(value: unknown): value is Session {
  if (!isRecord(value)) return false;
  if (typeof value.id !== 'number' || typeof value.start_time !== 'string') return false;
  return (
    isRecord(value.game) &&
    typeof value.game.id === 'number' &&
    typeof value.game.primary_name === 'string'
  );
}

export function isConflictStatus(error: unknown): error is AxiosError {
  return axios.isAxiosError(error) && error.response?.status === 409;
}

export function classifyConflict(
  conflict: ConflictResponse,
  editingSessionId?: number,
): 'overlap' | 'writer' {
  if (conflict.detail === WRITER_DETAIL) return 'writer';
  if (
    editingSessionId != null &&
    conflict.conflicting_session?.id === editingSessionId
  ) {
    return 'writer';
  }
  return 'overlap';
}

export function parseConflict(error: unknown): ConflictResponse | null {
  if (!isConflictStatus(error)) return null;

  const body = (error.response?.data as { detail?: unknown } | undefined)?.detail;
  if (!isRecord(body) || typeof body.detail !== 'string') return null;
  // A null, array, or partial blocker lacking fields read by ConflictNotice cannot
  // be rendered inline, so the caller treats it as a bare 409 (generic toast).
  if (!hasRenderableSession(body.conflicting_session)) return null;
  return { detail: body.detail, conflicting_session: body.conflicting_session };
}
