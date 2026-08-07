import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import { fixtures } from '../../test/fixtures';

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

describe('authStore pendingDeletion', () => {
  beforeEach(() => {
    localStorage.removeItem('auth-storage');
    useAuthStore.getState().logout();
  });

  it('clears pendingDeletion on logout', () => {
    useAuthStore
      .getState()
      .login('t', { discordId: '1', username: 'u' }, false, fixtures.pendingDeletion);
    expect(useAuthStore.getState().pendingDeletion).not.toBeNull();

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().pendingDeletion).toBeNull();
  });
});

describe('authStore previewDismissed', () => {
  beforeEach(() => {
    localStorage.removeItem('auth-storage');
    useAuthStore.getState().logout();
  });

  it('previewDismissed defaults to false', () => {
    expect(useAuthStore.getState().previewDismissed).toBe(false);
  });

  it('setPreviewDismissed updates the flag', () => {
    useAuthStore.getState().setPreviewDismissed(true);
    expect(useAuthStore.getState().previewDismissed).toBe(true);
  });

  it('logout resets previewDismissed to false', () => {
    useAuthStore.getState().setPreviewDismissed(true);
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().previewDismissed).toBe(false);
  });
});
