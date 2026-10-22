import { describe, it, expect } from 'vitest';
import { createPkcePair, isPkceSupported, randomState } from './pkce';

const BASE64URL = /^[A-Za-z0-9\-_]+$/;

describe('pkce', () => {
  it('reports support when crypto.subtle is available', () => {
    expect(isPkceSupported()).toBe(true);
  });

  it('creates an S256 pair with a base64url verifier and challenge', async () => {
    const pair = await createPkcePair();
    expect(pair.verifier).toMatch(BASE64URL);
    expect(pair.challenge).toMatch(BASE64URL);
    // RFC 7636 requires 43-128 chars for the verifier.
    expect(pair.verifier.length).toBeGreaterThanOrEqual(43);
    expect(pair.verifier.length).toBeLessThanOrEqual(128);
    expect(pair.challenge).not.toBe(pair.verifier);
  });

  it('derives the challenge as SHA-256 of the verifier', async () => {
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode('abc'),
    );
    const expected = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const { challenge } = await createPkcePair('abc');
    expect(challenge).toBe(expected);
  });

  it('produces a different verifier each call', async () => {
    const a = await createPkcePair();
    const b = await createPkcePair();
    expect(a.verifier).not.toBe(b.verifier);
  });

  it('produces a non-empty random state', () => {
    expect(randomState()).toMatch(BASE64URL);
    expect(randomState()).not.toBe(randomState());
  });
});
