import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore admin persistence', () => {
  beforeEach(() => {
    localStorage.removeItem('auth-storage');
    useAuthStore.getState().logout();
  });

  it('persists isAdmin so the sidebar link survives a reload', () => {
    useAuthStore.getState().login('t', { discordId: '1', username: 'u' }, true);

    const stored = JSON.parse(localStorage.getItem('auth-storage') ?? '{}');

    expect(stored.state.isAdmin).toBe(true);
  });

  it('clears isAdmin on logout', () => {
    useAuthStore.getState().login('t', { discordId: '1', username: 'u' }, true);
    useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAdmin).toBe(false);
  });
});
