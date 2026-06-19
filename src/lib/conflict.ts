import axios from 'axios';
import type { ConflictResponse } from '../types/api';

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