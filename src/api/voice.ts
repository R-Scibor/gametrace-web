import client from './client';
import type { TranscribeResponse } from '../types/api';

export const transcribeAudio = async (blob: Blob): Promise<TranscribeResponse> => {
  const form = new FormData();
  form.append('file', blob, 'recording.webm');

  const response = await client.post<TranscribeResponse>('/voice/transcribe', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return response.data;
};
