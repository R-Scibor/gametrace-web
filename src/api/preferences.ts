import client from './client';
import type { GamePreferenceUpdate } from '../types/api';

export const upsertPreference = async (gameId: number, payload: GamePreferenceUpdate): Promise<void> => {
  await client.put(`/user/preferences/${gameId}`, payload);
};

export const deletePreference = async (gameId: number): Promise<void> => {
  await client.delete(`/user/preferences/${gameId}`);
};
