import client from './client';
import type { ProfileMe, ProfileSettingsUpdate } from '../types/api';

export const getMe = async (): Promise<ProfileMe> => {
  const response = await client.get<ProfileMe>('/profile/me');
  return response.data;
};

export const updateSettings = async (payload: ProfileSettingsUpdate): Promise<ProfileMe> => {
  const response = await client.put<ProfileMe>('/profile/settings', payload);
  return response.data;
};
