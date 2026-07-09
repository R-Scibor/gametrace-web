import client from './client';
import type { Game } from '../types/api';

export interface AdminCoverUpload {
  image_base64: string;
  extension: string;
}

export const adminUploadCover = async (
  gameId: number,
  body: AdminCoverUpload,
): Promise<Game> => {
  const response = await client.put<Game>(`/admin/games/${gameId}/cover`, body);
  return response.data;
};