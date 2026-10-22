/**
 * PKCE (RFC 7636) helpers for the browser Discord OAuth flow.
 *
 * `crypto.subtle` only exists in a secure context, so on plain HTTP outside
 * localhost these throw rather than silently downgrading to `plain` — callers
 * gate on `isPkceSupported()` and tell the user instead.
 */

const VERIFIER_BYTES = 64; // → 86 base64url chars, inside RFC 7636's 43-128.
const STATE_BYTES = 16;

function base64url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomBase64url(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

export function isPkceSupported(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.subtle?.digest === 'function';
}

export function randomState(): string {
  return randomBase64url(STATE_BYTES);
}

export type PkcePair = { verifier: string; challenge: string };

/** `verifier` is injectable so tests can pin the digest; production omits it. */
export async function createPkcePair(verifier = randomBase64url(VERIFIER_BYTES)): Promise<PkcePair> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return { verifier, challenge: base64url(new Uint8Array(digest)) };
}
