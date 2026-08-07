import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { requestDeletion, cancelDeletion } from './profile';

describe('account deletion API', () => {
  it('returns the deletion status on 202', async () => {
    const status = await requestDeletion();
    expect(status.purge_at).toBe('2026-08-14T12:00:00Z');
    expect(status.days_left).toBe(7);
  });

  it('reports cancelled on 200', async () => {
    await expect(cancelDeletion()).resolves.toBe('cancelled');
  });

  it('reports not-scheduled on 404 instead of throwing', async () => {
    server.use(
      http.delete('/api/v1/profile/me/deletion', () =>
        HttpResponse.json({ detail: 'No deletion is scheduled for this account' }, { status: 404 }),
      ),
    );
    await expect(cancelDeletion()).resolves.toBe('not-scheduled');
  });

  it('propagates other errors', async () => {
    server.use(
      http.delete('/api/v1/profile/me/deletion', () =>
        HttpResponse.json({ detail: 'boom' }, { status: 500 }),
      ),
    );
    await expect(cancelDeletion()).rejects.toThrow();
  });
});
