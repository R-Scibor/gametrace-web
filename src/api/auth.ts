import client from './client';
import type { LoginResponse } from '../types/api';
import { normalizeLinkCode } from '../lib/linkCode';

export const linkLogin = async (code: string, timezone = 'UTC'): Promise<LoginResponse> => {
  const response = await client.post<LoginResponse>('/auth/link', {
    code: normalizeLinkCode(code),
    timezone,
  });
  return response.data;
};

export const logout = async (): Promise<void> => {
  await client.post('/auth/logout');
};