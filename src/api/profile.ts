import axios from 'axios';
import client from './client';
import type { DeletionStatus, ProfileMe, ProfileSettingsUpdate } from '../types/api';

export const getMe = async (): Promise<ProfileMe> => {
  const response = await client.get<ProfileMe>('/profile/me');
  return response.data;
};

export const updateSettings = async (payload: ProfileSettingsUpdate): Promise<ProfileMe> => {
  const response = await client.put<ProfileMe>('/profile/settings', payload);
  return response.data;
};

/** Schedules deletion. The backend revokes every token as part of this call,
 *  so the caller's own token is dead by the time this resolves. */
export const requestDeletion = async (): Promise<DeletionStatus> => {
  const response = await client.post<DeletionStatus>('/profile/me/deletion');
  return response.data;
};

/** Cancels a scheduled deletion. A 404 means nothing was scheduled — the
 *  caller's intent is still satisfied, but it must not be reported as success
 *  (api.md is explicit about this), so it is a distinct return value rather
 *  than a thrown error. */
export const cancelDeletion = async (): Promise<'cancelled' | 'not-scheduled'> => {
  try {
    await client.delete('/profile/me/deletion');
    return 'cancelled';
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return 'not-scheduled';
    }
    throw err;
  }
};
