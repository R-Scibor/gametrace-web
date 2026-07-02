import { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { login as loginApi, logout as logoutApi } from '../api/auth';
import { teardownAuth } from '../lib/authTeardown';

export function useAuth() {
  const authState = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (username: string) => {
    setLoading(true);
    setError(null);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await loginApi(username, tz);
      authState.login(res.token, { discordId: res.discord_id, username: res.username });
      return true;
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { detail?: string } | undefined)?.detail
        : err instanceof Error
          ? err.message
          : undefined;
      setError(message || 'Wystąpił błąd');
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
    handleLogin,
    logout: handleLogout,
  };
}