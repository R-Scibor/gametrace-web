import { afterEach, describe, expect, it, vi } from 'vitest';
import { getRuntimeEnv } from './runtimeConfig';

describe('getRuntimeEnv', () => {
  afterEach(() => {
    delete window.__RUNTIME_CONFIG__;
    vi.unstubAllEnvs();
  });

  it('returns window.__RUNTIME_CONFIG__ value when present', () => {
    vi.stubEnv('VITE_DISCORD_CLIENT_ID', 'build-time-id');
    window.__RUNTIME_CONFIG__ = {
      VITE_DISCORD_CLIENT_ID: 'runtime-id',
    };

    expect(getRuntimeEnv('VITE_DISCORD_CLIENT_ID')).toBe('runtime-id');
  });

  it('honors an explicit empty string in window.__RUNTIME_CONFIG__ over import.meta.env', () => {
    vi.stubEnv('VITE_DISCORD_CLIENT_ID', 'build-time-id');
    window.__RUNTIME_CONFIG__ = {
      VITE_DISCORD_CLIENT_ID: '',
    };

    expect(getRuntimeEnv('VITE_DISCORD_CLIENT_ID')).toBe('');
  });

  it('falls back to import.meta.env when key is missing or nullish in window.__RUNTIME_CONFIG__', () => {
    vi.stubEnv('VITE_DISCORD_SERVER_INVITE_URL', 'https://discord.gg/from-env');
    vi.stubEnv('VITE_DISCORD_BOT_INVITE_URL', '');
    window.__RUNTIME_CONFIG__ = {
      VITE_DISCORD_CLIENT_ID: 'only-client-id',
      VITE_DISCORD_BOT_INVITE_URL: undefined,
    };

    expect(getRuntimeEnv('VITE_DISCORD_SERVER_INVITE_URL')).toBe('https://discord.gg/from-env');
    expect(getRuntimeEnv('VITE_DISCORD_BOT_INVITE_URL')).toBe('');

    // Simulate a malformed null value injected externally
    (window.__RUNTIME_CONFIG__ as Record<string, unknown>).VITE_DISCORD_SERVER_INVITE_URL = null;
    expect(getRuntimeEnv('VITE_DISCORD_SERVER_INVITE_URL')).toBe('https://discord.gg/from-env');
  });

  it('falls back to import.meta.env when window.__RUNTIME_CONFIG__ is absent', () => {
    vi.stubEnv('VITE_APP_VERSION', '1.4.2');

    expect(getRuntimeEnv('VITE_APP_VERSION')).toBe('1.4.2');
  });
});
