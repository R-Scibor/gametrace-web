import axios from 'axios';
import type { ConflictResponse } from '../types/api';

export const OVERLAP_DETAIL = 'Session overlaps with an existing session';
export const WRITER_DETAIL = 'Session was updated by another writer';

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
  if (!axios.isAxiosError(error)) return null;
  if (error.response?.status !== 409) return null;

  const body = error.response.data?.detail;
  if (
    body &&
    typeof body === 'object' &&
    'conflicting_session' in body &&
    'detail' in body
  ) {
    return body as ConflictResponse;
  }
  return null;
}
