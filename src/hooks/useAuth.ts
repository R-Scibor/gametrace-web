import { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import {
  linkLogin as linkLoginApi,
  discordLogin as discordLoginApi,
  logout as logoutApi,
} from '../api/auth';
import type { LoginResponse } from '../types/api';
import { teardownAuth } from '../lib/authTeardown';
import { clearScheduledDeletion } from '../lib/accountDeletion';
import i18n from '../i18n';

const linkErrorMessage = (err: unknown): string => {
  if (!axios.isAxiosError(err)) {
    return err instanceof Error ? err.message : i18n.t('auth:errors.generic');
  }
  const status = err.response?.status;
  switch (status) {
    case 401:
      return i18n.t('auth:errors.invalidCode');
    case 422:
      return i18n.t('auth:errors.codeFormat');
    case 429: {
      const retryAfter = err.response?.headers?.['retry-after'];
      return retryAfter
        ? i18n.t('auth:errors.rateLimitedRetry', { seconds: retryAfter })
        : i18n.t('auth:errors.rateLimited');
    }
    case 503:
      return i18n.t('auth:errors.unavailable');
    default:
      return err.response
        ? i18n.t('auth:errors.loginFailed')
        : i18n.t('auth:errors.connection');
  }
};

const discordErrorMessage = (err: unknown): string => {
  if (!axios.isAxiosError(err)) {
    return err instanceof Error ? err.message : i18n.t('auth:errors.generic');
  }
  switch (err.response?.status) {
    case 400:
      // The origin we redirected to is missing from the backend allowlist.
      return i18n.t('auth:errors.discordRedirect');
    case 401:
      return i18n.t('auth:errors.discordDenied');
    case 409:
      return i18n.t('auth:errors.discordConflict');
    case 429:
      return i18n.t('auth:errors.rateLimited');
    case 502:
    case 503:
      return i18n.t('auth:errors.discordUnavailable');
    default:
      return err.response
        ? i18n.t('auth:errors.loginFailed')
        : i18n.t('auth:errors.connection');
  }
};

/** Shared tail of every login path: commit the session, then act on flags. */
const commitLogin = (res: LoginResponse) => {
  if (!res.pending_deletion) {
    // A stale scheduled-deletion screen must not survive a login that
    // proves the account is no longer scheduled (e.g. cancelled elsewhere).
    clearScheduledDeletion();
  }
  useAuthStore
    .getState()
    .login(
      res.token,
      { discordId: res.discord_id, username: res.username },
      res.is_admin,
      res.pending_deletion,
    );
};

export function useAuth() {
  const authState = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLinkLogin = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      commitLogin(await linkLoginApi(code, tz));
      return true;
    } catch (err: unknown) {
      setError(linkErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Second leg of the OAuth redirect: exchange the authorization code the
  // callback route received. The PKCE verifier comes from sessionStorage.
  const handleDiscordLogin = async (
    code: string,
    codeVerifier: string,
    redirectUri: string,
  ) => {
    setLoading(true);
    setError(null);
    try {
      commitLogin(await discordLoginApi(code, codeVerifier, redirectUri));
      return true;
    } catch (err: unknown) {
      setError(discordErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // best effort
    } finally {
      teardownAuth();
    }
  };

  return {
    ...authState,
    loading,
    error,
    handleLinkLogin,
    handleDiscordLogin,
    setError,
    logout: handleLogout,
  };
}
