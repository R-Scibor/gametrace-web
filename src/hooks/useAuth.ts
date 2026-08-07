import { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { linkLogin as linkLoginApi, logout as logoutApi } from '../api/auth';
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

export function useAuth() {
  const authState = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLinkLogin = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await linkLoginApi(code, tz);
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
      return true;
    } catch (err: unknown) {
      setError(linkErrorMessage(err));
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
    logout: handleLogout,
  };
}
