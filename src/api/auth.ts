import client from './client';
import type { LoginResponse } from '../types/api';
import { normalizeLinkCode } from '../lib/linkCode';

export const linkLogin = async (code: string, timezone = 'UTC'): Promise<LoginResponse> => {
  const response = await client.post<LoginResponse>('/auth/link', {
    code: normalizeLinkCode(code),
    timezone,
  });
  return response.data;
};

// Complete the Discord OAuth2 flow. The backend does the confidential token
// exchange (the client secret stays server-side); we only forward the auth
// code, the PKCE verifier, and the exact redirect_uri used to authorize.
// Backend dependency: DiscordCallbackRequest takes no `timezone`, so a Discord
// login cannot set the user's timezone the way /auth/link does.
export const discordLogin = async (
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<LoginResponse> => {
  const response = await client.post<LoginResponse>('/auth/discord', {
    code,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
  });
  return response.data;
};

export const logout = async (): Promise<void> => {
  await client.post('/auth/logout');
};