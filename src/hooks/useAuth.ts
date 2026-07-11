import { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { linkLogin as linkLoginApi, logout as logoutApi } from '../api/auth';
import { teardownAuth } from '../lib/authTeardown';

const linkErrorMessage = (err: unknown): string => {
  if (!axios.isAxiosError(err)) {
    return err instanceof Error ? err.message : 'Wystąpił błąd';
  }
  const status = err.response?.status;
  switch (status) {
    case 401:
      return 'Nieprawidłowy lub wygasły kod. Uruchom /login na Discordzie ponownie.';
    case 422:
      return 'Kod musi mieć 6 cyfr.';
    case 429: {
      const retryAfter = err.response?.headers?.['retry-after'];
      return retryAfter
        ? `Zbyt wiele prób. Spróbuj ponownie za ${retryAfter} s.`
        : 'Zbyt wiele prób. Spróbuj ponownie później.';
    }
    case 503:
      return 'Logowanie kodem jest chwilowo niedostępne. Spróbuj później.';
    default:
      return err.response
        ? 'Nie udało się zalogować. Spróbuj ponownie.'
        : 'Błąd połączenia z serwerem';
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
      useAuthStore
        .getState()
        .login(res.token, { discordId: res.discord_id, username: res.username }, res.is_admin);
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