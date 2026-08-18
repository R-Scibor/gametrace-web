/**
 * Browser half of the Discord OAuth2 login. We only ever obtain an
 * authorization code: the confidential token exchange happens on the backend
 * (`POST /auth/discord`), so the client secret never reaches the SPA.
 *
 * The verifier and CSRF state live in sessionStorage across the full-page
 * redirect to Discord and back to /auth/discord/callback.
 */
import { createPkcePair, isPkceSupported, randomState } from './pkce';

const AUTHORIZE_URL = 'https://discord.com/oauth2/authorize';
const SCOPES = 'identify guilds';
const HANDOFF_KEY = 'gametrace.discord-oauth';

type Handoff = { state: string; verifier: string; redirectUri: string };

export function getDiscordClientId(): string {
  return String(import.meta.env.VITE_DISCORD_CLIENT_ID ?? '').trim();
}

/** Must match an entry in the backend's DISCORD_OAUTH_REDIRECT_URIS allowlist. */
export function getDiscordRedirectUri(): string {
  return `${window.location.origin}/auth/discord/callback`;
}

export function isDiscordLoginEnabled(): boolean {
  return getDiscordClientId() !== '';
}

/** False on plain HTTP outside localhost, where `crypto.subtle` is absent. */
export function isSecureContextAvailable(): boolean {
  return isPkceSupported();
}

/** Stores the PKCE handoff and returns the URL to send the browser to. */
export async function beginDiscordLogin(): Promise<string> {
  const clientId = getDiscordClientId();
  if (!clientId) throw new Error('Discord client id is not configured');

  const { verifier, challenge } = await createPkcePair();
  const redirectUri = getDiscordRedirectUri();
  const state = randomState();

  const handoff: Handoff = { state, verifier, redirectUri };
  sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(handoff));

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: SCOPES,
    redirect_uri: redirectUri,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'consent',
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

/** Full-page navigation to Discord's consent screen (own fn so tests can stub it). */
export async function redirectToDiscord(): Promise<void> {
  window.location.assign(await beginDiscordLogin());
}

/**
 * Pure read: returns the stored handoff only if `state` matches what we sent.
 * Callers clear it with `clearDiscordHandoff` once they act on it, so a
 * replayed callback URL cannot reuse the verifier.
 */
export function readDiscordHandoff(
  state: string,
): { verifier: string; redirectUri: string } | null {
  const raw = sessionStorage.getItem(HANDOFF_KEY);
  if (!raw) return null;

  let stored: Handoff;
  try {
    stored = JSON.parse(raw) as Handoff;
  } catch {
    return null;
  }
  if (!stored.state || stored.state !== state) return null;

  return { verifier: stored.verifier, redirectUri: stored.redirectUri };
}

export function clearDiscordHandoff(): void {
  sessionStorage.removeItem(HANDOFF_KEY);
}
