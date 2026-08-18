import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  beginDiscordLogin,
  clearDiscordHandoff,
  readDiscordHandoff,
  getDiscordRedirectUri,
  isDiscordLoginEnabled,
} from './discordOAuth';

describe('discordOAuth', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubEnv('VITE_DISCORD_CLIENT_ID', '123456789');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('is enabled only when a client id is configured', () => {
    expect(isDiscordLoginEnabled()).toBe(true);
    vi.stubEnv('VITE_DISCORD_CLIENT_ID', '');
    expect(isDiscordLoginEnabled()).toBe(false);
  });

  it('derives the redirect uri from the current origin', () => {
    expect(getDiscordRedirectUri()).toBe(`${window.location.origin}/auth/discord/callback`);
  });

  it('builds an authorize url with PKCE and the required scopes', async () => {
    const url = new URL(await beginDiscordLogin());
    expect(url.origin + url.pathname).toBe('https://discord.com/oauth2/authorize');
    expect(url.searchParams.get('client_id')).toBe('123456789');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('scope')).toBe('identify guilds');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('code_challenge')).toBeTruthy();
    expect(url.searchParams.get('redirect_uri')).toBe(getDiscordRedirectUri());
    expect(url.searchParams.get('state')).toBeTruthy();
  });

  it('hands the verifier back only for the matching state', async () => {
    const url = new URL(await beginDiscordLogin());
    const state = url.searchParams.get('state')!;

    expect(readDiscordHandoff('some-other-state')).toBeNull();
    const handoff = readDiscordHandoff(state);
    expect(handoff).not.toBeNull();
    expect(handoff!.verifier).toBeTruthy();
    expect(handoff!.redirectUri).toBe(getDiscordRedirectUri());
  });

  it('stops handing back the verifier once cleared', async () => {
    const url = new URL(await beginDiscordLogin());
    const state = url.searchParams.get('state')!;
    expect(readDiscordHandoff(state)).not.toBeNull();
    clearDiscordHandoff();
    expect(readDiscordHandoff(state)).toBeNull();
  });

  it('returns null when no login was started', () => {
    expect(readDiscordHandoff('anything')).toBeNull();
  });

  it('throws when no client id is configured', async () => {
    vi.stubEnv('VITE_DISCORD_CLIENT_ID', '');
    await expect(beginDiscordLogin()).rejects.toThrow();
  });
});
