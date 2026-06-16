import client from './client';
import type { LoginResponse } from '../types/api';

export const login = async (username: string, timezone = 'UTC'): Promise<LoginResponse> => {
  const response = await client.post<LoginResponse>('/auth/login', { username, timezone });
  return response.data;
};

export const logout = async (): Promise<void> => {
  await client.post('/auth/logout');
};
