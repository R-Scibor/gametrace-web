import client from './client';
import type { Session, SessionCreate, SessionPatch, SessionStatus, TrashSession } from '../types/api';

export const listSessions = async (params?: { status?: SessionStatus[]; limit?: number; skip?: number; }): Promise<Session[]> => {
  const response = await client.get<Session[]>('/sessions', {
    params: { status: params?.status, limit: params?.limit, skip: params?.skip },
  });
  return response.data;
};

export const getSession = async (sessionId: number): Promise<Session> => {
  const response = await client.get<Session>(`/sessions/${sessionId}`);
  return response.data;
};

export const createSession = async (payload: SessionCreate): Promise<Session> => {
  const response = await client.post<Session>('/sessions', payload);
  return response.data;
};

export const patchSession = async (sessionId: number, payload: SessionPatch): Promise<Session> => {
  const response = await client.patch<Session>(`/sessions/${sessionId}`, payload);
  return response.data;
};

export const getTrash = async (skip = 0, limit = 100): Promise<TrashSession[]> => {
  const response = await client.get<TrashSession[]>('/sessions/trash', { params: { skip, limit } });
  return response.data;
};

export const restoreSession = async (sessionId: number): Promise<Session> => {
  const response = await client.post<Session>(`/sessions/${sessionId}/restore`);
  return response.data;
};

export const deleteSession = async (sessionId: number): Promise<void> => {
  await client.delete(`/sessions/${sessionId}`);
};

export const hardDeleteSession = async (sessionId: number): Promise<void> => {
  await client.delete(`/sessions/${sessionId}`, { params: { hard: true } });
};
